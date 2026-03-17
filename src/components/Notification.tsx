import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useNotification, useAppStore } from '@/store/appStore';

export function Notification() {
  const notification = useNotification();
  const clearNotification = useAppStore(state => state.clearNotification);

  if (!notification) return null;

  const config = {
    success: {
      icon: CheckCircle2,
      bg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-800',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-100',
      iconColor: 'text-primary-600',
      textColor: 'text-primary-800',
    },
  };

  const c = config[notification.type] ?? config.info;
  const Icon = c.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 60, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 60, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-6 right-6 z-[70]"
      >
        <div className={`
          ${c.bg} rounded-lg
          flex items-center gap-3 px-4 py-3
          min-w-[280px] max-w-sm
        `}>
          <Icon className={`w-5 h-5 ${c.iconColor} flex-shrink-0`} />

          <p className={`flex-1 text-sm font-semibold ${c.textColor} leading-snug`}>
            {notification.message}
          </p>

          <button
            type="button"
            onClick={clearNotification}
            className={`p-1 rounded-md ${c.textColor} opacity-60 hover:opacity-100 transition-all duration-200 flex-shrink-0`}
            aria-label="Fermer la notification"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
