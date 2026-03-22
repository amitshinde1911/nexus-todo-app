import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validatePassword } from '../utils/validation';
import { clsx } from '../lib/utils';
import { useToast } from '../components/ToastProvider';

export default function AuthPage({ onAuthSuccess }: { onAuthSuccess: (email: string) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    
    // Auth hooks
    const { login, register, error: authError, loading } = useAuth();
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (!validateEmail(email)) {
            setLocalError('Invalid coordination vector (email format).');
            return;
        }

        if (!isLogin && !validatePassword(password)) {
            setLocalError('Password must be 8+ chars with uppercase, number, and symbol.');
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
                toast.success("Protocol Established. New Identity Registered.");
            }
            onAuthSuccess(email);
        } catch (err: any) {
            // Error managed by hook
        }
    };

    const displayError = localError || authError;

    return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-6 selection:bg-[var(--accent-soft)] selection:text-[var(--accent)] relative overflow-hidden">
            <div className="absolute top-10 left-10 w-[60%] h-[60%] bg-[var(--accent)] opacity-[0.03] blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[440px] relative animate-slide-up">
                <div className="relative glass-card p-12 overflow-hidden group">
                    <div className="mb-12 text-center">
                        <h1 className="text-5xl font-bold text-[var(--text-primary)] tracking-tighter mb-4 text-center">NEXUS</h1>
                        <p className="text-[var(--text-secondary)]/40 text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-center">
                            {isLogin ? 'Protocol Authorization' : 'New Identity Required'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] mb-4 ml-1">Coordination Vector</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-all placeholder:text-white/10"
                                placeholder="Enter email address..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[var(--text-secondary)]/40 uppercase tracking-[0.2em] mb-4 ml-1">Security Cipher</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]/50 transition-all placeholder:text-white/10"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {displayError && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold text-center animate-shake tracking-wide">
                                {displayError.toUpperCase()}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading}
                            className={clsx(
                                "btn-primary w-full py-5 text-[11px] font-black uppercase tracking-[0.3em]",
                                loading && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Initialize' : 'Authorize')}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] font-bold text-[var(--text-secondary)]/40 hover:text-[var(--accent)] transition-colors uppercase tracking-[0.2em]"
                        >
                            {isLogin ? "Generate New Protocol Access" : "Existing Authorization Detected"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
