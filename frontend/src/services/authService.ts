import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "../config/firebase";

const mapAuthError = (code: string): string => {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Unauthorized Vector. Identification failed.';
    case 'auth/email-already-in-use':
      return 'Coordination conflict. This identity is already established.';
    case 'auth/weak-password':
      return 'Security Cipher failed complexity audit.';
    case 'auth/too-many-requests':
      return 'System overload. Try again after cooling down.';
    default:
      return 'Protocol interruption. Authentication failed.';
  }
};

export const authService = {
  login: async (email: string, pass: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      throw new Error(mapAuthError(err.code));
    }
  },

  register: async (email: string, pass: string) => {
    try {
      return await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      throw new Error(mapAuthError(err.code));
    }
  },

  logout: () => {
    return signOut(auth);
  },

  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};
