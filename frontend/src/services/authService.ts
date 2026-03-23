import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

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

  syncUserProfile: async (user: FirebaseUser) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL || '',
        provider: user.providerData[0]?.providerId || 'email',
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } else {
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
    }
    return userSnap.data();
  },

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err: any) {
      throw new Error(mapAuthError(err.code));
    }
  },

  onAuthStateChange: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  }
};
