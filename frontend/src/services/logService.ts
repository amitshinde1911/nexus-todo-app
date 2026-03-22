import { 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";
import { db } from "../config/firebase";
import { AppLog } from "../types";

const COLLECTION_NAME = "logs_global";

export const logService = {
  logEvent: async (log: Omit<AppLog, 'timestamp'>) => {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...log,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Critical: Failed to ship log to Nexus Command.", err);
    }
  },

  subscribeToLogs: (callback: (logs: AppLog[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppLog[];
      callback(logs);
    });
  }
};
