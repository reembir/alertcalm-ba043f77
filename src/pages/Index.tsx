import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BreathingCircle from "@/components/BreathingCircle";
import CalmMessage from "@/components/CalmMessage";
import AlertButton from "@/components/AlertButton";
import SafeSpaceIndicator from "@/components/SafeSpaceIndicator";
import CompletionScreen from "@/components/CompletionScreen";

const COUNTDOWN_DURATION = 60;

const Index = () => {
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
    <div className="min-h-screen flex flex-col items-center px-4 pb-8">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-md">
        <AnimatePresence mode="wait">
          {isComplete ? (
            <CompletionScreen key="complete" onReset={resetAll} />
          ) : (
            <motion.div
              key="main"
              className="flex flex-col items-center gap-12 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Safe space indicator */}
              <SafeSpaceIndicator isActive={isActive} countdown={countdown} />

              {/* Breathing circle */}
              <BreathingCircle isActive={isActive} countdown={countdown} />

              {/* Calming message */}
              <div className="min-h-[100px] flex items-center">
                <CalmMessage isActive={isActive} countdown={countdown} />
              </div>

              {/* Control button */}
              <AlertButton
                isActive={isActive}
                onStart={startAlert}
                onStop={stopAlert}
              />

              {/* Info text when not active */}
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
      </main>

      {/* Decorative floating elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-calm-lavender/30 blur-3xl"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-calm-peach/40 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-calm-sage/30 blur-2xl"
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};

export default Index;
