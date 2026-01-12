import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

interface SafeSpaceIndicatorProps {
  isActive: boolean;
  countdown: number;
}

const SafeSpaceIndicator = ({ isActive, countdown }: SafeSpaceIndicatorProps) => {
  const isAlmostSafe = countdown <= 10;

  if (!isActive) return null;

  return (
    <motion.div
      className="safe-badge flex items-center gap-2 rtl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      {isAlmostSafe ? (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>כמעט במרחב המוגן</span>
        </>
      ) : (
        <>
          <ArrowRight className="w-4 h-4" />
          <span>בדרך למרחב המוגן</span>
        </>
      )}
    </motion.div>
  );
};

export default SafeSpaceIndicator;
