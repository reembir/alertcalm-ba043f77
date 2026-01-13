import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

interface Alert {
  id: string;
  title: string;
  cities: string[];
  time: string;
  countdown: number;
  category?: string;
  description?: string;
}

interface UseAlertsOptions {
  homeCity?: string | null;
  onAlertForHome?: (alert: Alert) => void;
}

export const useAlerts = ({ homeCity, onAlertForHome }: UseAlertsOptions = {}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [relevantAlerts, setRelevantAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const previousAlertsRef = useRef<string[]>([]);
  const { sendNotification, permission } = usePushNotifications();

  const isAlertRelevant = useCallback((alert: Alert, city: string | null | undefined): boolean => {
    if (!city) return false;
    
    const normalizedHomeCity = city.trim().toLowerCase();
    
    return alert.cities.some(alertCity => {
      const normalizedAlertCity = alertCity.trim().toLowerCase();
      return normalizedAlertCity.includes(normalizedHomeCity) || 
             normalizedHomeCity.includes(normalizedAlertCity);
    });
  }, []);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching alerts from edge function...');
      
      const { data, error } = await supabase.functions.invoke('pikud-haoref-alerts', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching alerts:', error);
        setConnectionStatus('disconnected');
        return;
      }

      console.log('Received alerts:', data);
      const newAlerts: Alert[] = data?.alerts || [];
      setAlerts(newAlerts);
      setLastUpdate(new Date(data?.lastUpdate || Date.now()));
      setConnectionStatus('connected');

      // Filter relevant alerts for home city
      if (homeCity) {
        const relevant = newAlerts.filter(alert => isAlertRelevant(alert, homeCity));
        setRelevantAlerts(relevant);

        // Check for new relevant alerts
        const newAlertIds = relevant.map(a => a.id);
        const previousAlertIds = previousAlertsRef.current;
        
        const brandNewAlerts = relevant.filter(
          alert => !previousAlertIds.includes(alert.id)
        );

        if (brandNewAlerts.length > 0) {
          // Trigger callback for new home alerts
          brandNewAlerts.forEach(alert => {
            onAlertForHome?.(alert);
            
            // Send push notification
            if (permission === 'granted') {
              sendNotification('🚨 אזעקה באזור שלך!', {
                body: `${alert.title}\n${alert.cities.slice(0, 3).join(', ')}\n${alert.countdown} שניות למרחב מוגן`,
                tag: alert.id,
                requireInteraction: true
              });
            }
          });
        }

        previousAlertsRef.current = newAlertIds;
      }

    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, [homeCity, isAlertRelevant, onAlertForHome, permission, sendNotification]);

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Refresh every 5 seconds for real-time updates
    const interval = setInterval(fetchAlerts, 5000);
    
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return {
    alerts,
    relevantAlerts,
    isLoading,
    lastUpdate,
    connectionStatus,
    refresh: fetchAlerts,
    hasRelevantAlerts: relevantAlerts.length > 0
  };
};
