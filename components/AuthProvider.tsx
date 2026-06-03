'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { migrateOrPull, periodicSync, readSnapshot } from '@/lib/sync';
import { flushQueue, queueSize } from '@/lib/offlineQueue';

interface AuthContextType {
  uid: string | null;
  name: string;
  loading: boolean;
  isOnline: boolean;
  syncError: string | null;
  dataVersion: number;
  pendingCount: number;
  setIdentity: (uid: string, name: string) => void;
  clearIdentity: () => void;
}

const AuthContext = createContext<AuthContextType>({
  uid: null,
  name: '',
  loading: true,
  isOnline: true,
  syncError: null,
  dataVersion: 0,
  pendingCount: 0,
  setIdentity: () => {},
  clearIdentity: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid]               = useState<string | null>(null);
  const [name, setName]             = useState('');
  const [loading, setLoading]       = useState(true);
  const [isOnline, setIsOnline]     = useState(true);
  const [syncError, setSyncError]   = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const interval    = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineRef   = useRef(true);
  const snapshotRef = useRef<Record<string, string>>({});

  const bumpVersion = () => setDataVersion(v => v + 1);
  const uidRef = useRef<string | null>(null);

  const stopSync = () => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  };

  const startSync = (userId: string) => {
    stopSync();
    snapshotRef.current = readSnapshot();

    interval.current = setInterval(async () => {
      if (!onlineRef.current) return;
      try {
        const prevSnap = snapshotRef.current;
        snapshotRef.current = await periodicSync(userId, prevSnap);

        // If cloud had newer data, some keys in localStorage changed — tell pages
        const cloudUpdated = Object.keys(snapshotRef.current).some(
          k => snapshotRef.current[k] !== prevSnap[k]
        );
        if (cloudUpdated) bumpVersion();

        setSyncError(null);
      } catch (e: any) {
        setSyncError(e.message);
      }
    }, 15000);
  };

  const beginSync = (userId: string) => {
    migrateOrPull(userId)
      .then((pulled) => {
        setSyncError(null);
        snapshotRef.current = readSnapshot();
        if (pulled > 0) bumpVersion(); // pages re-read localStorage
      })
      .catch((e: any) => setSyncError(e.message))
      .finally(() => startSync(userId));
  };

  // Keep pendingCount in sync whenever the queue changes
  useEffect(() => {
    const update = () => setPendingCount(queueSize());
    update();
    window.addEventListener('paisaos:queue-changed', update);
    return () => window.removeEventListener('paisaos:queue-changed', update);
  }, []);

  useEffect(() => {
    const goOnline = async () => {
      onlineRef.current = true;
      setIsOnline(true);
      // Flush any offline operations that were queued while disconnected
      if (uidRef.current) {
        const synced = await flushQueue(uidRef.current);
        if (synced > 0) bumpVersion();
      }
    };
    const goOffline = () => { onlineRef.current = false; setIsOnline(false); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    const storedUid  = localStorage.getItem('paisaos_uid');
    const storedName = localStorage.getItem('paisaos_username') || '';

    if (storedUid) {
      setUid(storedUid);
      setName(storedName);
      uidRef.current = storedUid;
      beginSync(storedUid);
    }

    setLoading(false);

    return () => {
      stopSync();
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const setIdentity = (newUid: string, newName: string) => {
    setUid(newUid);
    setName(newName);
    uidRef.current = newUid;
    beginSync(newUid);
  };

  const clearIdentity = () => {
    stopSync();
    localStorage.removeItem('paisaos_uid');
    localStorage.removeItem('paisaos_username');
    setUid(null);
    setName('');
    setSyncError(null);
  };

  return (
    <AuthContext.Provider value={{ uid, name, loading, isOnline, syncError, dataVersion, pendingCount, setIdentity, clearIdentity }}>
      {children}
    </AuthContext.Provider>
  );
}
