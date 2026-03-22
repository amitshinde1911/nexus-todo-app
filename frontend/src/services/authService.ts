import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "../config/firebase";

export const authService = {
  login: (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  },

  register: (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
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
