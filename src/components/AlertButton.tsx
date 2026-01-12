import { motion } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertButtonProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const AlertButton = ({ isActive, onStart, onStop }: AlertButtonProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {!isActive ? (
        <Button
          onClick={onStart}
          size="lg"
          className="gap-3 px-8 py-6 text-lg rounded-2xl shadow-soft hover:shadow-glow transition-shadow duration-300"
        >
          <Bell className="w-5 h-5" />
          <span>התחל סימולציה</span>
        </Button>
      ) : (
        <Button
          onClick={onStop}
          variant="outline"
          size="lg"
          className="gap-3 px-8 py-6 text-lg rounded-2xl border-2 hover:bg-destructive/10 transition-colors duration-300"
        >
          <X className="w-5 h-5" />
          <span>עצור</span>
        </Button>
      )}
    </motion.div>
  );
};

export default AlertButton;
