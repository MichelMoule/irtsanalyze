import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useNotification, useAppStore } from '@/store/appStore';

export function Notification() {
  const notification = useNotification();
  const clearNotification = useAppStore(state => state.clearNotification);

  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-primary-500',
  };

  const Icon = icons[notification.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div className={`${styles[notification.type]} text-white rounded-xl shadow-dropdown p-4 flex items-center gap-3 min-w-[300px]`}>
          <div className="p-1.5 bg-white/20 rounded-lg">
            <Icon className="w-4 h-4 flex-shrink-0" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={clearNotification}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
