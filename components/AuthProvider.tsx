'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { migrateOrPull, periodicSync, readSnapshot } from '@/lib/sync';

interface AuthContextType {
  uid: string | null;
  name: string;
  loading: boolean;
  isOnline: boolean;
  syncError: string | null;
  setIdentity: (uid: string, name: string) => void;
  clearIdentity: () => void;
}

const AuthContext = createContext<AuthContextType>({
  uid: null,
  name: '',
  loading: true,
  isOnline: true,
  syncError: null,
  setIdentity: () => {},
  clearIdentity: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid]             = useState<string | null>(null);
  const [name, setName]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [isOnline, setIsOnline]   = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const interval    = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineRef   = useRef(true);
  const snapshotRef = useRef<Record<string, string>>({});

  const stopSync = () => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  };

  const startSync = (userId: string) => {
    stopSync();
    // Take initial snapshot so first interval knows the baseline
    snapshotRef.current = readSnapshot();

    interval.current = setInterval(async () => {
      if (!onlineRef.current) return;
      try {
        // Push any keys that changed since last tick, then pull latest
        snapshotRef.current = await periodicSync(userId, snapshotRef.current);
        setSyncError(null);
      } catch (e: any) {
        setSyncError(e.message);
      }
    }, 15000);
  };

  const beginSync = (userId: string) => {
    migrateOrPull(userId)
      .then(() => {
        setSyncError(null);
        // Refresh snapshot after initial pull so interval starts clean
        snapshotRef.current = readSnapshot();
      })
      .catch((e: any) => setSyncError(e.message))
      .finally(() => startSync(userId));
  };

  useEffect(() => {
    const goOnline  = () => { onlineRef.current = true;  setIsOnline(true);  };
    const goOffline = () => { onlineRef.current = false; setIsOnline(false); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    const storedUid  = localStorage.getItem('paisaos_uid');
    const storedName = localStorage.getItem('paisaos_username') || '';

    if (storedUid) {
      setUid(storedUid);
      setName(storedName);
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
    <AuthContext.Provider value={{ uid, name, loading, isOnline, syncError, setIdentity, clearIdentity }}>
      {children}
    </AuthContext.Provider>
  );
}
