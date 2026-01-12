import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BreathingCircle from '@/components/BreathingCircle';
import CalmMessage from '@/components/CalmMessage';
import AlertButton from '@/components/AlertButton';
import SafeSpaceIndicator from '@/components/SafeSpaceIndicator';
import CompletionScreen from '@/components/CompletionScreen';

const COUNTDOWN_DURATION = 60;

const HomeTab = () => {
  const [isActive, setIsActive] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isComplete, setIsComplete] = useState(false);

  const startAlert = useCallback(() => {
    setIsActive(true);
    setCountdown(COUNTDOWN_DURATION);
    setIsComplete(false);
  }, []);

  const stopAlert = useCallback(() => {
    setIsActive(false);
    setCountdown(COUNTDOWN_DURATION);
  }, []);

  const resetAll = useCallback(() => {
    setIsActive(false);
    setCountdown(COUNTDOWN_DURATION);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setIsActive(false);
      setIsComplete(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, countdown]);

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <AnimatePresence mode="wait">
        {isComplete ? (
          <CompletionScreen key="complete" onReset={resetAll} />
        ) : (
          <motion.div
            key="main"
            className="flex flex-col items-center gap-8 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SafeSpaceIndicator isActive={isActive} countdown={countdown} />
            <BreathingCircle isActive={isActive} countdown={countdown} />
            
            <div className="min-h-[100px] flex items-center">
              <CalmMessage isActive={isActive} countdown={countdown} />
            </div>

            <AlertButton
              isActive={isActive}
              onStart={startAlert}
              onStop={stopAlert}
            />

            {!isActive && (
              <motion.p
                className="text-center text-muted-foreground text-sm max-w-xs rtl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                לחץ על הכפתור לסימולציה של התראה רגועה עם הנחיות נשימה
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomeTab;
