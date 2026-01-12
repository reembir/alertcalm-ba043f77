import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Copy, Check, MapPin, Heart, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FamilyMember {
  id: string;
  display_name: string;
  is_safe: boolean;
  last_seen: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  invite_code: string;
  members: FamilyMember[];
}

const FamilyTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    try {
      // Get groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('family_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const groupIds = memberData.map(m => m.group_id);

      if (groupIds.length === 0) {
        setGroups([]);
        setIsLoading(false);
        return;
      }

      // Get group details
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('*')
        .in('id', groupIds);

      if (groupError) throw groupError;

      // Get members for each group with their latest safety status
      const groupsWithMembers: FamilyGroup[] = await Promise.all(
        (groupData || []).map(async (group) => {
          const { data: members } = await supabase
            .from('family_group_members')
            .select('user_id, profiles(id, display_name)')
            .eq('group_id', group.id);

          const membersWithStatus = await Promise.all(
            (members || []).map(async (member: any) => {
              const { data: checkin } = await supabase
                .from('safety_checkins')
                .select('is_safe, created_at')
                .eq('user_id', member.user_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              return {
                id: member.profiles.id,
                display_name: member.profiles.display_name,
                is_safe: checkin?.is_safe ?? true,
                last_seen: checkin?.created_at ?? 'לא ידוע'
              };
            })
          );

          return {
            id: group.id,
            name: group.name,
            invite_code: group.invite_code,
            members: membersWithStatus
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    try {
      const { data: group, error: groupError } = await supabase
        .from('family_groups')
        .insert({ name: newGroupName.trim(), created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('family_group_members')
        .insert({ group_id: group.id, user_id: user.id });

      if (memberError) throw memberError;

      toast({ title: 'הקבוצה נוצרה!', description: `קוד ההזמנה: ${group.invite_code}` });
      setNewGroupName('');
      setShowCreateGroup(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'לא הצלחנו ליצור את הקבוצה' });
    }
  };

  const joinGroup = async () => {
    if (!user || !joinCode.trim()) return;

    try {
      const { data: group, error: findError } = await supabase
        .from('family_groups')
        .select('id, name')
        .eq('invite_code', joinCode.trim().toLowerCase())
        .single();

      if (findError || !group) {
        toast({ variant: 'destructive', title: 'קוד לא נמצא', description: 'הקוד שהזנת לא תקין' });
        return;
      }

      const { error: joinError } = await supabase
        .from('family_group_members')
        .insert({ group_id: group.id, user_id: user.id });

      if (joinError) {
        if (joinError.code === '23505') {
          toast({ variant: 'destructive', title: 'כבר חבר', description: 'אתה כבר חבר בקבוצה הזו' });
        } else {
          throw joinError;
        }
        return;
      }

      toast({ title: 'הצטרפת!', description: `הצטרפת לקבוצה "${group.name}"` });
      setJoinCode('');
      setShowJoinGroup(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'לא הצלחנו להצטרף לקבוצה' });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const markAsSafe = async () => {
    if (!user) return;

    try {
      await supabase.from('safety_checkins').insert({
        user_id: user.id,
        is_safe: true,
        message: 'אני בסדר!'
      });

      toast({ title: '✓ עודכן', description: 'המשפחה שלך יודעת שאתה בסדר' });
      fetchGroups();
    } catch (error) {
      console.error('Error marking as safe:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 rtl">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">התחבר לצפייה במשפחה</h3>
          <p className="text-muted-foreground max-w-xs">
            התחבר כדי ליצור קבוצות משפחה, לראות מיקום ולוודא שכולם בסדר
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            התחבר
          </Button>
          <Button variant="outline" onClick={() => navigate('/auth')} className="gap-2">
            <UserPlus className="w-4 h-4" />
            הירשם
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="breathing-circle w-16 h-16 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 rtl">
      {/* Quick safety button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          onClick={markAsSafe}
          className="w-full py-6 text-lg rounded-2xl gap-3 bg-calm-sage hover:bg-calm-sage/80 text-foreground"
        >
          <Heart className="w-6 h-6" />
          אני בסדר - עדכן את המשפחה
        </Button>
      </motion.div>

      {/* Groups */}
      {groups.length === 0 ? (
        <motion.div
          className="calm-card p-6 text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">אין קבוצות עדיין</h3>
            <p className="text-sm text-muted-foreground mt-1">
              צור קבוצה חדשה או הצטרף לקבוצה קיימת
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              className="calm-card p-4 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{group.name}</h3>
                <button
                  onClick={() => copyInviteCode(group.invite_code)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {copiedCode === group.invite_code ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {group.invite_code}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {group.members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-xl flex items-center gap-2 ${
                      member.is_safe ? 'bg-calm-sage/50' : 'bg-destructive/10'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        member.is_safe ? 'bg-primary' : 'bg-destructive'
                      }`}
                    />
                    <span className="text-sm font-medium truncate">{member.display_name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => setShowCreateGroup(!showCreateGroup)}
          className="py-6 rounded-xl"
        >
          <Plus className="w-4 h-4 ml-2" />
          צור קבוצה
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowJoinGroup(!showJoinGroup)}
          className="py-6 rounded-xl"
        >
          <Users className="w-4 h-4 ml-2" />
          הצטרף לקבוצה
        </Button>
      </div>

      {/* Create group form */}
      <AnimatePresence>
        {showCreateGroup && (
          <motion.div
            className="calm-card p-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Input
              placeholder="שם הקבוצה (למשל: משפחת כהן)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="text-right"
            />
            <Button onClick={createGroup} className="w-full">
              צור קבוצה
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join group form */}
      <AnimatePresence>
        {showJoinGroup && (
          <motion.div
            className="calm-card p-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Input
              placeholder="קוד הזמנה"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="text-center"
              dir="ltr"
            />
            <Button onClick={joinGroup} className="w-full">
              הצטרף
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FamilyTab;
