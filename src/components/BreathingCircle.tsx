import { motion } from "framer-motion";

interface BreathingCircleProps {
  isActive: boolean;
  countdown: number;
}

const BreathingCircle = ({ isActive, countdown }: BreathingCircleProps) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isActive && (
        <>
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
          />
        </>
      )}

      {/* Main breathing circle */}
      <motion.div
        className="breathing-circle w-56 h-56 flex items-center justify-center relative z-10"
        animate={
          isActive
            ? {
                scale: [1, 1.1, 1],
                boxShadow: [
                  "0 0 40px hsl(180 45% 55% / 0.2)",
                  "0 0 60px hsl(180 45% 55% / 0.4)",
                  "0 0 40px hsl(180 45% 55% / 0.2)",
                ],
              }
            : { scale: 1 }
        }
        transition={{
          duration: 4,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <div className="text-center">
          {isActive ? (
            <>
              <motion.span
                className="text-6xl font-bold text-primary-foreground block"
                key={countdown}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {countdown}
              </motion.span>
              <span className="text-primary-foreground/80 text-lg font-medium">
                שניות
              </span>
            </>
          ) : (
            <span className="text-primary-foreground text-xl font-medium">
              נשימה רגועה
            </span>
          )}
        </div>
      </motion.div>

      {/* Instruction text during breathing */}
      {isActive && (
        <motion.div
          className="absolute -bottom-16 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            className="text-lg text-muted-foreground font-medium"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            {countdown > 30 ? "שאפו... נשפו..." : "ממשיכים לנשום..."}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};

export default BreathingCircle;
