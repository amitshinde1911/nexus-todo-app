import { useState } from 'react';
import { authService } from '../services/authService';
import { logService } from '../services/logService';

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, pass);
      await logService.logEvent({
        userId: email,
        type: 'INFO',
        action: 'LOGIN_SUCCESS',
        message: `User ${email} initiated authentication sequence.`
      });
    } catch (err: any) {
      const msg = err.message || 'Authentication sequence failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(email, pass);
      await logService.logEvent({
        userId: email,
        type: 'INFO',
        action: 'REGISTER_SUCCESS',
        message: `User ${email} established new protocol credentials.`
      });
    } catch (err: any) {
      const msg = err.message || 'Registration sequence failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Sign-out protocol failed.", err);
    }
  };

  return { login, logout, register, error, loading };
};
