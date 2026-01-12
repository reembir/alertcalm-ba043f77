import { motion } from 'framer-motion';
import { Home, Users, Settings, Bell } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'בית', icon: Home },
  { id: 'alerts', label: 'התראות', icon: Bell },
  { id: 'family', label: 'משפחה', icon: Users },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border safe-area-bottom z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors relative"
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  layoutId="activeTab"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <Icon
                className={`w-6 h-6 relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs font-medium relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
