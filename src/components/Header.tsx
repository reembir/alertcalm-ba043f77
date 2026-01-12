import { motion } from "framer-motion";
import { Feather } from "lucide-react";

const Header = () => {
  return (
    <motion.header
      className="text-center py-8 rtl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Feather className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">רוגע</h1>
      </div>
      <p className="text-muted-foreground text-lg">
        התראות רגועות בזמני חירום
      </p>
    </motion.header>
  );
};

export default Header;
