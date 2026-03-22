import React, { createContext, useContext, useState, useCallback } from 'react';
import { clsx } from '../lib/utils';

interface ToastContextType {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useCallback((message: string, type: Toast['type'] = 'info', duration = 3000) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, message, type }]);
        
        setTimeout(() => {
            removeToast(id);
        }, duration);
    }, [removeToast]);

    const success = (msg: string) => toast(msg, 'success');
    const error = (msg: string) => toast(msg, 'error');
    const info = (msg: string) => toast(msg, 'info');

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
                {toasts.map(t => (
                    <div 
                        key={t.id}
                        className={clsx(
                            "min-w-[280px] max-w-md p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 pointer-events-auto",
                            t.type === 'success' && "bg-green-500/10 border-green-500/20 text-green-500",
                            t.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-500",
                            t.type === 'info' && "bg-secondary/40 border-border/50 text-foreground"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <div className="shrink-0">
                                {t.type === 'success' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                {t.type === 'error' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                                {t.type === 'info' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
                            </div>
                            <p className="text-sm font-bold tracking-tight">{t.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        // Return safe no-op fallback when used outside ToastProvider
        return { success: () => {}, error: () => {}, info: () => {} };
    }
    return context;
};
