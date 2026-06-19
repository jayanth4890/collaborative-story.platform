import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
          icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200',
          icon: <Info className="w-5 h-5 text-indigo-400" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full sm:w-96">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 animate-fade-in ${styles.bg}`}
            >
              <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
              <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors duration-150 p-0.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
