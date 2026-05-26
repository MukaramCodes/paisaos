'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { migrateOrPull, syncPendingToCloud, getPendingCount } from '@/lib/sync';

interface AuthContextType {
  uid: string | null;
  name: string;
  loading: boolean;
  isOnline: boolean;
  pendingCount: number;
  syncError: string | null;
  setIdentity: (uid: string, name: string) => void;
  clearIdentity: () => void;
}

const AuthContext = createContext<AuthContextType>({
  uid: null,
  name: '',
  loading: true,
  isOnline: true,
  pendingCount: 0,
  syncError: null,
  setIdentity: () => {},
  clearIdentity: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid]                   = useState<string | null>(null);
  const [name, setName]                 = useState('');
  const [loading, setLoading]           = useState(true);
  const [isOnline, setIsOnline]         = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError]       = useState<string | null>(null);
  const interval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineRef = useRef(true);

  const startSync = (userId: string) => {
    if (interval.current) clearInterval(interval.current);
    interval.current = setInterval(async () => {
      if (!onlineRef.current) return;
      try {
        await syncPendingToCloud(userId);
        setSyncError(null);
      } catch (e: any) {
        setSyncError(e.message);
      }
      setPendingCount(getPendingCount());
    }, 15000);
  };

  const stopSync = () => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  };

  const beginSync = (userId: string) => {
    migrateOrPull(userId)
      .then(() => setSyncError(null))
      .catch((e: any) => setSyncError(e.message))
      .finally(() => {
        setPendingCount(getPendingCount());
        startSync(userId);
      });
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
    <AuthContext.Provider value={{ uid, name, loading, isOnline, pendingCount, syncError, setIdentity, clearIdentity }}>
      {children}
    </AuthContext.Provider>
  );
}
