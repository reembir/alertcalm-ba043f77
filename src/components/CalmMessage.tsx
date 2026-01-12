import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Leaf } from "lucide-react";

interface CalmMessageProps {
  isActive: boolean;
  countdown: number;
}

const messages = [
  { text: "יש לך זמן. הכול בסדר.", icon: Heart },
  { text: "אתה במקום בטוח.", icon: Shield },
  { text: "נשימה עמוקה, רגע אחד בכל פעם.", icon: Leaf },
  { text: "את חזקה. תעברי את זה.", icon: Heart },
  { text: "המרחב המוגן קרוב.", icon: Shield },
];

const CalmMessage = ({ isActive, countdown }: CalmMessageProps) => {
  // Rotate messages based on countdown
  const messageIndex = Math.floor((60 - countdown) / 12) % messages.length;
  const currentMessage = messages[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={messageIndex}
          className="calm-card p-6 max-w-sm mx-auto rtl"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 justify-end">
            <p className="text-xl font-medium text-foreground text-right">
              {currentMessage.text}
            </p>
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-secondary-foreground" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CalmMessage;
