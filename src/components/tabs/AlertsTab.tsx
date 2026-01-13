import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, MapPin, Clock, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Alert {
  id: string;
  title: string;
  cities: string[];
  time: string;
  countdown: number;
  category?: string;
  description?: string;
}

const AlertsTab = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      console.log('Fetching alerts from edge function...');
      
      const { data, error } = await supabase.functions.invoke('pikud-haoref-alerts', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching alerts:', error);
        setConnectionStatus('disconnected');
        toast.error('שגיאה בקבלת התראות');
        return;
      }

      console.log('Received alerts:', data);
      setAlerts(data?.alerts || []);
      setLastUpdate(new Date(data?.lastUpdate || Date.now()));
      setConnectionStatus('connected');

      // If there are new alerts, show notification
      if (data?.alerts?.length > 0) {
        toast.warning(`${data.alerts.length} התראות פעילות!`, {
          duration: 10000,
        });
      }

    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchAlerts, 5000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500 animate-pulse';
    }
  };

  return (
    <div className="space-y-6 rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            התראות פיקוד העורף
            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchAlerts}
          disabled={isRefreshing}
          className="rounded-full"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Connection status */}
      <motion.div
        className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
          connectionStatus === 'connected' 
            ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
            : connectionStatus === 'disconnected'
            ? 'bg-red-500/10 text-red-700 dark:text-red-400'
            : 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Shield className="w-4 h-4" />
        {connectionStatus === 'connected' && 'מחובר לפיקוד העורף - מקבל התראות בזמן אמת'}
        {connectionStatus === 'disconnected' && 'נותק מהמערכת - מנסה להתחבר מחדש...'}
        {connectionStatus === 'checking' && 'בודק חיבור למערכת...'}
      </motion.div>

      {/* Alerts list */}
      <motion.div
        className="calm-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {alerts.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-calm-sage flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">אין התראות פעילות</h3>
              <p className="text-muted-foreground text-sm mt-1">
                המצב רגוע. האפליקציה מתעדכנת אוטומטית כל 5 שניות
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                initial={{ opacity: 0, scale: 0.95, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{alert.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {alert.cities.slice(0, 5).join(', ')}
                      {alert.cities.length > 5 && ` ועוד ${alert.cities.length - 5} יישובים`}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 inline ml-1" />
                        {alert.time}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                        {alert.countdown} שניות למרחב מוגן
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Info section */}
      <div className="calm-card p-4 space-y-2">
        <p className="text-sm text-muted-foreground text-center">
          🔔 האפליקציה מחוברת ישירות ל-API של פיקוד העורף
        </p>
        <p className="text-xs text-muted-foreground/70 text-center">
          מתעדכן אוטומטית כל 5 שניות | נתונים בזמן אמת
        </p>
      </div>
    </div>
  );
};

export default AlertsTab;
