import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, MapPin, Clock, AlertTriangle, Shield, Home } from 'lucide-react';
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

interface AlertsTabProps {
  homeCity?: string | null;
}

const AlertsTab = ({ homeCity }: AlertsTabProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  const isAlertRelevant = (alert: Alert): boolean => {
    if (!homeCity) return true; // Show all alerts if no home city set
    
    const normalizedHomeCity = homeCity.trim().toLowerCase();
    return alert.cities.some(alertCity => {
      const normalizedAlertCity = alertCity.trim().toLowerCase();
      return normalizedAlertCity.includes(normalizedHomeCity) || 
             normalizedHomeCity.includes(normalizedAlertCity);
    });
  };

  const fetchAlerts = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pikud-haoref-alerts', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching alerts:', error);
        setConnectionStatus('disconnected');
        return;
      }

      setAlerts(data?.alerts || []);
      setLastUpdate(new Date(data?.lastUpdate || Date.now()));
      setConnectionStatus('connected');

      const relevantAlerts = (data?.alerts || []).filter(isAlertRelevant);
      if (relevantAlerts.length > 0) {
        toast.warning(`${relevantAlerts.length} התראות באזור שלך!`, {
          duration: 10000,
        });
      }

    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsRefreshing(false);
    }
  }, [homeCity]);

  useEffect(() => {
    fetchAlerts();
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

  const relevantAlerts = alerts.filter(isAlertRelevant);
  const otherAlerts = alerts.filter(a => !isAlertRelevant(a));

  return (
    <div className="space-y-6 rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            התראות פיקוד העורף
            <span className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          </h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            עודכן: {lastUpdate.toLocaleTimeString('he-IL')}
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

      {homeCity && (
        <div className="p-3 rounded-xl bg-primary/10 flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-primary" />
          <span>מציג התראות עבור: <strong>{homeCity}</strong></span>
        </div>
      )}

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
        {connectionStatus === 'connected' && 'מחובר לפיקוד העורף'}
        {connectionStatus === 'disconnected' && 'מנסה להתחבר מחדש...'}
        {connectionStatus === 'checking' && 'בודק חיבור...'}
      </motion.div>

      <motion.div
        className="calm-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {relevantAlerts.length === 0 && otherAlerts.length === 0 ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-calm-sage flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">אין התראות פעילות</h3>
              <p className="text-muted-foreground text-sm mt-1">
                המצב רגוע. מתעדכן כל 5 שניות
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {relevantAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className="p-4 rounded-xl bg-destructive/20 border-2 border-destructive"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center flex-shrink-0 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">{alert.title}</h4>
                      <span className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs">
                        באזור שלך!
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {alert.cities.slice(0, 3).join(', ')}
                      {alert.cities.length > 3 && ` +${alert.cities.length - 3}`}
                    </div>
                    <span className="inline-block mt-2 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                      {alert.countdown} שניות למרחב מוגן
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {otherAlerts.length > 0 && (
              <>
                <div className="text-sm text-muted-foreground text-center py-2">
                  התראות באזורים אחרים ({otherAlerts.length})
                </div>
                {otherAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl bg-muted/50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      {alert.cities.slice(0, 3).join(', ')}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </motion.div>

      <div className="calm-card p-4">
        <p className="text-sm text-muted-foreground text-center">
          🔔 מחובר ל-API של פיקוד העורף | מתעדכן כל 5 שניות
        </p>
      </div>
    </div>
  );
};

export default AlertsTab;
