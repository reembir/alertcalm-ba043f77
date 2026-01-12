import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, RefreshCw, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  title: string;
  cities: string[];
  time: string;
  countdown: number;
}

// Mock alerts for demo - in production this would come from Pikud HaOref API
const mockAlerts: Alert[] = [];

const AlertsTab = () => {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refreshAlerts = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    // Refresh every 10 seconds
    const interval = setInterval(refreshAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">התראות פיקוד העורף</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" />
            עודכן לאחרונה: {lastUpdate.toLocaleTimeString('he-IL')}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refreshAlerts}
          disabled={isRefreshing}
          className="rounded-full"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Status card */}
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
                המצב רגוע. האפליקציה תתריע אוטומטית כשתהיה אזעקה
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                className="p-4 rounded-xl bg-destructive/10 border border-destructive/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{alert.title}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {alert.cities.join(', ')}
                    </div>
                    <p className="text-sm text-destructive font-medium mt-2">
                      {alert.countdown} שניות למרחב מוגן
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Info section */}
      <div className="calm-card p-4">
        <p className="text-sm text-muted-foreground text-center">
          💡 האפליקציה מתחברת לפיקוד העורף ומקבלת התראות בזמן אמת. 
          כשתהיה אזעקה, תקבל התראה רגועה עם הנחיות.
        </p>
      </div>
    </div>
  );
};

export default AlertsTab;
