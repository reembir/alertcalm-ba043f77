import { motion } from "framer-motion";
import { CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompletionScreenProps {
  onReset: () => void;
}

const CompletionScreen = ({ onReset }: CompletionScreenProps) => {
  return (
    <motion.div
      className="text-center rtl space-y-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success icon */}
      <motion.div
        className="w-24 h-24 mx-auto rounded-full bg-calm-sage flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
      >
        <CheckCircle2 className="w-12 h-12 text-primary" />
      </motion.div>

      {/* Message */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground">הגעת בשלום</h2>
        <p className="text-lg text-muted-foreground">
          אתה במרחב המוגן. נשימה עמוקה, הכול בסדר.
        </p>
      </motion.div>

      {/* Heart animation */}
      <motion.div
        className="flex justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          >
            <Heart className="w-5 h-5 text-destructive fill-current" />
          </motion.div>
        ))}
      </motion.div>

      {/* Reset button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="px-8 py-6 text-lg rounded-2xl"
        >
          חזרה למסך הראשי
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CompletionScreen;
