import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import HomeTab from '@/components/tabs/HomeTab';
import AlertsTab from '@/components/tabs/AlertsTab';
import FamilyTab from '@/components/tabs/FamilyTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useAlerts } from '@/hooks/useAlerts';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [homeCity, setHomeCity] = useState<string | null>(null);
  const [triggerBreathing, setTriggerBreathing] = useState(false);
  const { user } = useAuth();

  // Fetch user's home city
  useEffect(() => {
    const fetchHomeCity = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('alert_settings')
        .select('home_city')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.home_city) {
        setHomeCity(data.home_city);
      }
    };

    fetchHomeCity();
  }, [user]);

  // Handle alert for home area
  const handleAlertForHome = useCallback(() => {
    setActiveTab('home');
    setTriggerBreathing(true);
  }, []);

  // Use alerts hook
  useAlerts({
    homeCity,
    onAlertForHome: handleAlertForHome
  });

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab autoStart={triggerBreathing} onAutoStartHandled={() => setTriggerBreathing(false)} />;
      case 'alerts':
        return <AlertsTab homeCity={homeCity} />;
      case 'family':
        return <FamilyTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pb-24">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md py-4">
        <motion.div
          key={activeTab}
          className="w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </main>

      {/* Decorative floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-calm-lavender/30 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-calm-peach/40 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-calm-sage/30 blur-2xl"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
