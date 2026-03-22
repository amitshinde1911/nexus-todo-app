import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { db as localDb } from '../db';
import { auth, db as cloudDb } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

interface SyncContextType {
    performSync: () => void;
    isSyncing: boolean;
    isOnline: boolean;
}

const SyncContext = createContext<SyncContextType>({
    performSync: () => {},
    isSyncing: false,
    isOnline: true,
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }: { children: ReactNode }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [userId, setUserId] = useState<string | null>(null);

    // ─── Network State ───────────────────────────────────────────────────────────
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // ─── Firebase Auth Listener ──────────────────────────────────────────────────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user ? user.uid : null);
        });
        return () => unsubscribe();
    }, []);

    // ─── Real-Time Firestore Sync ─────────────────────────────────────────────────
    useEffect(() => {
        if (!userId) return;

        setIsSyncing(true);
        const tasksRef = collection(cloudDb, 'users', userId, 'tasks');
        const q = query(tasksRef, orderBy('version', 'desc'), limit(100));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.metadata.hasPendingWrites) return;

            await (localDb as any).transaction('rw', (localDb as any).tasks, async () => {
                for (const change of snapshot.docChanges()) {
                    const serverTask = change.doc.data();
                    const localTask = await (localDb as any).tasks.get(serverTask.id);

                    if (change.type === 'removed') {
                        await (localDb as any).tasks.delete(serverTask.id);
                    } else {
                        if (!localTask || serverTask.version >= (localTask.version || 0)) {
                            await (localDb as any).tasks.put(serverTask);
                        }
                    }
                }
            });
            setIsSyncing(false);
        }, (error) => {
            console.error("Firestore sync error:", error);
            setIsSyncing(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const performSync = () => {
        // NOP - Firestore handles real-time sync automatically
    };

    return (
        <SyncContext.Provider value={{ performSync, isSyncing, isOnline }}>
            {children}
        </SyncContext.Provider>
    );
};
