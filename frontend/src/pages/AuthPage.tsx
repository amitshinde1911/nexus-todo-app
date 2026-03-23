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
            {/* Background Layer */}
            <div className="absolute inset-0 bg-[var(--bg-main)] z-0" />

            <div className="w-full max-w-[440px] relative z-10 animate-slide-up">
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white">
                        <span className="font-semibold text-xl">N</span>
                    </div>
                    <span className="font-semibold text-2xl tracking-tight text-[var(--text-primary)]">
                        nexus
                    </span>
                </div>

                <div className="card p-10 relative overflow-hidden">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">{isLogin ? 'Sign in' : 'Create account'}</h1>
                        <p className="text-[var(--text-secondary)] text-sm">
                            {isLogin ? 'Access your account' : 'Start your journey'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 ml-1">Email address</label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white border border-[var(--border)] rounded-md px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]/30"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 ml-1">Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white border border-[var(--border)] rounded-md px-4 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)]/30"
                                placeholder="Your secure password"
                                required
                            />
                            {!isLogin && (
                                <p className="mt-2 ml-1 text-[10px] text-[var(--text-secondary)]">
                                    Min. 8 chars, 1 uppercase, 1 number & 1 symbol
                                </p>
                            )}
                        </div>

                        {displayError && (
                            <div className="p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-[11px] font-medium text-center">
                                {displayError.toLowerCase().charAt(0).toUpperCase() + displayError.slice(1).toLowerCase()}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loading || googleLoading}
                            className={clsx(
                                "btn-primary w-full py-2.5 text-sm font-semibold",
                                (loading || googleLoading) && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Create account')}
                        </button>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border)]"></div>
                            </div>
                            <div className="relative flex justify-center text-[11px]">
                                <span className="bg-white px-3 text-[var(--text-secondary)]">Or continue with</span>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white border border-[var(--border)] rounded-md text-sm font-medium hover:bg-gray-50 transition-all"
                        >
                            {googleLoading ? (
                                <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.19 2.733 1.073 6.72l4.193 3.045z"/>
                                    <path fill="#FBBC05" d="M1.073 6.72A7.127 7.127 0 0 0 0 12c0 1.885.538 3.642 1.477 5.125l4.314-3.324a3.81 3.81 0 0 1-.725-2.036c0-1.127.291-2.182.725-3.045L1.073 6.72z"/>
                                    <path fill="#4285F4" d="M12 24c3.245 0 5.973-1.073 7.964-2.909l-3.845-2.982c-1.1.736-2.509 1.173-4.119 1.173-3.173 0-5.855-2.136-6.818-5.018l-4.314 3.324C3.19 21.267 7.273 24 12 24z"/>
                                    <path fill="#34A853" d="M24 12c0-.853-.08-1.707-.218-2.545H12v4.836h6.709a5.732 5.732 0 0 1-2.482 3.755l3.845 2.982C22.318 19.345 24 16 24 12z"/>
                                </svg>
                            )}
                            <span>
                                {googleLoading ? 'Syncing...' : 'Continue with Google'}
                            </span>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button 
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] font-medium transition-all"
                        >
                            {isLogin ? "No account? Click here to sign up" : "Have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
