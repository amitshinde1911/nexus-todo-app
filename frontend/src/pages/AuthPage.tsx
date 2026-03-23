import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAuthContext } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';
import { clsx } from '../lib/utils';
import { useToast } from '../components/ToastProvider';

export default function AuthPage({ onAuthSuccess }: { onAuthSuccess: (email: string) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    
    // Auth hooks
    const { login, register, error: authError, loading } = useAuth();
    const { loginWithGoogle } = useAuthContext();
    const toast = useToast();

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setLocalError('');
        try {
            await loginWithGoogle();
            onAuthSuccess('Google Identity');
        } catch (err: any) {
            setLocalError(err.message || 'Identity synchronization failed.');
        } finally {
            setGoogleLoading(false);
        }
    };

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
            {/* Nuclear Solid Background Isolation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-10 left-10 w-[60%] h-[60%] bg-[var(--accent)] opacity-[0.03] blur-[140px] rounded-full" />
                <div className="absolute bottom-10 right-10 w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-[440px] relative z-10 animate-slide-up">
                <div className="relative glass-card p-12 overflow-hidden group">
                    <div className="mb-12 text-center pointer-events-none select-none">
                        <h1 className="text-5xl font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase italic opacity-90">NEXUS</h1>
                        <p className="text-[var(--text-secondary)]/30 text-[9px] font-black uppercase tracking-[0.5em] mb-2">
                            {isLogin ? 'Authorization Required' : 'Establish New Protocol'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                            disabled={loading || googleLoading}
                            className={clsx(
                                "btn-primary w-full py-5 text-[11px] font-black uppercase tracking-[0.3em]",
                                (loading || googleLoading) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Initialize' : 'Authorize')}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.4em]">
                                <span className="bg-[var(--bg-main)] px-4 text-[var(--text-secondary)]/20 italic">Alternative Vector</span>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/[0.06] hover:border-[var(--accent)]/30 transition-all group/google"
                        >
                            {googleLoading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.19 2.733 1.073 6.72l4.193 3.045z"/>
                                    <path fill="#FBBC05" d="M1.073 6.72A7.127 7.127 0 0 0 0 12c0 1.885.538 3.642 1.477 5.125l4.314-3.324a3.81 3.81 0 0 1-.725-2.036c0-1.127.291-2.182.725-3.045L1.073 6.72z"/>
                                    <path fill="#4285F4" d="M12 24c3.245 0 5.973-1.073 7.964-2.909l-3.845-2.982c-1.1.736-2.509 1.173-4.119 1.173-3.173 0-5.855-2.136-6.818-5.018l-4.314 3.324C3.19 21.267 7.273 24 12 24z"/>
                                    <path fill="#34A853" d="M24 12c0-.853-.08-1.707-.218-2.545H12v4.836h6.709a5.732 5.732 0 0 1-2.482 3.755l3.845 2.982C22.318 19.345 24 16 24 12z"/>
                                </svg>
                            )}
                            <span className="opacity-60 group-hover/google:opacity-100 transition-opacity">
                                {googleLoading ? 'Syncing...' : 'Continue with Google'}
                            </span>
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[9px] font-black text-[var(--text-secondary)]/30 hover:text-[var(--accent)] transition-all uppercase tracking-[0.3em] hover:tracking-[0.4em]"
                        >
                            {isLogin ? "Generate New Protocol Access" : "Existing Authorization Detected"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
