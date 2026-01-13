import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Vibrate, MapPin, LogOut, User, Bell, Check, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Settings {
  alert_sound: string;
  vibration_enabled: boolean;
  auto_share_location: boolean;
  home_city: string;
  push_enabled: boolean;
}

const alertSounds = [
  { id: 'calm-bell', name: 'פעמון רגוע', emoji: '🔔' },
  { id: 'gentle-chime', name: 'צלצול עדין', emoji: '🎵' },
  { id: 'soft-waves', name: 'גלי ים', emoji: '🌊' },
  { id: 'forest-birds', name: 'ציפורי יער', emoji: '🐦' },
  { id: 'meditation-bowl', name: 'קערת מדיטציה', emoji: '🎶' },
];

const israelCities = [
  'תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'אשדוד', 'אשקלון',
  'נתניה', 'רמת גן', 'פתח תקווה', 'הרצליה', 'כפר סבא', 'רעננה',
  'ראשון לציון', 'חולון', 'בת ים', 'נתיבות', 'שדרות', 'אופקים',
  'קריית גת', 'דימונה', 'אילת', 'עכו', 'נהריה', 'קריית שמונה',
  'טבריה', 'צפת', 'מודיעין', 'רחובות', 'נס ציונה', 'יבנה'
];

const SettingsTab = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [settings, setSettings] = useState<Settings>({
    alert_sound: 'calm-bell',
    vibration_enabled: true,
    auto_share_location: false,
    home_city: '',
    push_enabled: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [showCities, setShowCities] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alert_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          alert_sound: data.alert_sound,
          vibration_enabled: data.vibration_enabled,
          auto_share_location: data.auto_share_location,
          home_city: data.home_city || '',
          push_enabled: data.push_enabled || false
        });
        setCitySearch(data.home_city || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;

    setIsSaving(true);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    try {
      const { error } = await supabase
        .from('alert_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: 'נשמר!', description: 'ההגדרות עודכנו בהצלחה' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ variant: 'destructive', title: 'שגיאה', description: 'לא הצלחנו לשמור את ההגדרות' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast({ variant: 'destructive', title: 'שגיאה', description: 'יש לאשר התראות בדפדפן' });
        return;
      }
    }
    saveSettings({ push_enabled: enabled });
  };

  const selectCity = (city: string) => {
    setCitySearch(city);
    setShowCities(false);
    saveSettings({ home_city: city });
  };

  const filteredCities = israelCities.filter(city => 
    city.includes(citySearch) || citySearch === ''
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="space-y-6 rtl">
      {/* User info */}
      {user && (
        <motion.div
          className="calm-card p-4 flex items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">{user.email}</p>
            <p className="text-sm text-muted-foreground">מחובר</p>
          </div>
        </motion.div>
      )}

      {/* Home city selection */}
      <motion.div
        className="calm-card p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">מיקום הבית שלי</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          תקבל התראות רק כשיש אזעקה באזור שלך
        </p>
        <div className="relative">
          <Input
            placeholder="חפש עיר..."
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setShowCities(true);
            }}
            onFocus={() => setShowCities(true)}
            className="w-full"
          />
          {showCities && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
              {filteredCities.map(city => (
                <button
                  key={city}
                  onClick={() => selectCity(city)}
                  className={`w-full text-right px-4 py-2 hover:bg-primary/10 transition-colors ${
                    settings.home_city === city ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>
        {settings.home_city && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span>תקבל התראות עבור: {settings.home_city}</span>
          </div>
        )}
      </motion.div>

      {/* Push notifications */}
      {isSupported && (
        <motion.div
          className="calm-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">התראות Push</p>
                <p className="text-sm text-muted-foreground">קבל התראות גם כשהאפליקציה סגורה</p>
              </div>
            </div>
            <Switch
              checked={settings.push_enabled}
              onCheckedChange={handlePushToggle}
            />
          </div>
        </motion.div>
      )}

      {/* Alert sound selection */}
      <motion.div
        className="calm-card p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">צליל התראה</h3>
        </div>
        
        <div className="grid gap-2">
          {alertSounds.map((sound) => (
            <button
              key={sound.id}
              onClick={() => saveSettings({ alert_sound: sound.id })}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                settings.alert_sound === sound.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-secondary/50 border-2 border-transparent hover:border-primary/30'
              }`}
            >
              <span className="text-xl">{sound.emoji}</span>
              <span className="flex-1 text-right font-medium">{sound.name}</span>
              {settings.alert_sound === sound.id && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Toggle settings */}
      <motion.div
        className="calm-card p-4 space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vibrate className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">רטט</p>
              <p className="text-sm text-muted-foreground">רטט בזמן התראה</p>
            </div>
          </div>
          <Switch
            checked={settings.vibration_enabled}
            onCheckedChange={(checked) => saveSettings({ vibration_enabled: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-foreground">שיתוף מיקום אוטומטי</p>
              <p className="text-sm text-muted-foreground">שתף מיקום עם המשפחה בזמן התראה</p>
            </div>
          </div>
          <Switch
            checked={settings.auto_share_location}
            onCheckedChange={(checked) => saveSettings({ auto_share_location: checked })}
          />
        </div>
      </motion.div>

      {/* Sign out */}
      {user ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full py-6 rounded-xl gap-2 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
            התנתק
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            onClick={() => navigate('/auth')}
            className="w-full py-6 rounded-xl gap-2"
          >
            <User className="w-5 h-5" />
            התחבר כדי לשמור הגדרות
          </Button>
        </motion.div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        רוגע גרסה 1.0.0
      </p>
    </div>
  );
};

export default SettingsTab;
