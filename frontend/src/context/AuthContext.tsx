import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  loginWithGoogle: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect results for mobile PWA mode
    const checkRedirect = async () => {
      try {
        const redirectedUser = await authService.handleRedirectResult();
        if (redirectedUser) {
          await authService.syncUserProfile(redirectedUser);
          setUser(redirectedUser);
        }
      } catch (err) {
        console.error("Redirect auth error:", err);
      }
    };
    checkRedirect();

    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        await authService.syncUserProfile(firebaseUser);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
