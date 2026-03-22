import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../config/firebase";
import { Task } from "../types";

const COLLECTION_NAME = "tasks";

export const taskService = {
  createTask: async (userId: string, taskData: Partial<Task>) => {
    const taskRef = doc(collection(db, `users/${userId}/${COLLECTION_NAME}`));
    const newTask: Partial<Task> = {
      ...taskData,
      id: taskRef.id,
      userId,
      completed: false,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1
    };
    await setDoc(taskRef, newTask);
    return taskRef.id;
  },

  updateTask: async (userId: string, taskId: string, updates: Partial<Task>) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  deleteTask: async (userId: string, taskId: string) => {
    const taskRef = doc(db, `users/${userId}/${COLLECTION_NAME}/${taskId}`);
    await updateDoc(taskRef, {
      deleted: true,
      updatedAt: serverTimestamp()
    });
  },

  subscribeToTasks: (userId: string, callback: (tasks: Task[], error?: any) => void) => {
    const q = query(
      collection(db, `users/${userId}/${COLLECTION_NAME}`),
      where("deleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      callback(tasks, null);
    }, (error) => {
      console.error("Firestore Error:", error);
      callback([], error);
    });
  }
};
