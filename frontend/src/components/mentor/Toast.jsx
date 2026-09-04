import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isOk = toast.type === 'success';
            const isErr = toast.type === 'error';
            const isWarn = toast.type === 'warning';
            const Icon = isOk ? CheckCircle2 : isErr ? AlertCircle : isWarn ? AlertTriangle : Info;

            const borderClass = isOk
              ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-950'
              : isErr
              ? 'border-red-400/60 bg-red-500/20 text-red-950'
              : isWarn
              ? 'border-amber-400/60 bg-amber-500/20 text-amber-950'
              : 'border-[#0b6fb8]/60 bg-[#0b6fb8]/20 text-[#032038]';

            const iconColor = isOk
              ? 'text-emerald-700'
              : isErr
              ? 'text-red-700'
              : isWarn
              ? 'text-amber-700'
              : 'text-[#0b6fb8]';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border-2 backdrop-blur-xl shadow-2xl ${borderClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={20} className={`${iconColor} shrink-0`} />
                  <span className="text-xs font-extrabold leading-snug">{toast.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="p-1 rounded-lg hover:bg-black/10 transition text-current shrink-0"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
