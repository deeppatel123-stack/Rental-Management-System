import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => {
                        let bgColor = 'border-l-indigo-505 dark:border-l-brand-400';
                        let Icon = Info;
                        let iconColor = 'text-indigo-500 dark:text-brand-400 bg-indigo-500/10';
                        let title = 'System Information';

                        if (t.type === 'success') {
                            bgColor = 'border-l-emerald-520';
                            Icon = CheckCircle2;
                            iconColor = 'text-emerald-500 bg-emerald-500/10';
                            title = 'Success Statement';
                        } else if (t.type === 'error') {
                            bgColor = 'border-l-rose-520';
                            Icon = AlertTriangle;
                            iconColor = 'text-rose-500 bg-rose-500/10';
                            title = 'Action Required';
                        }

                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className={`pointer-events-auto p-4 rounded-2xl glass-panel shadow-lg border-l-4 ${bgColor} flex items-start gap-3 w-full select-none`}
                            >
                                <div className={`p-1.5 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 space-y-0.5">
                                    <h4 className="text-xs font-black text-slate-800 dark:text-white">{title}</h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">{t.message}</p>
                                </div>
                                <button
                                    onClick={() => removeToast(t.id)}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be wrapped inside a ToastProvider');
    }
    return context;
};
