'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { migrateOrPull, syncPendingToCloud, getPendingCount } from '@/lib/sync';

interface AuthContextType {
  uid: string | null;
  name: string;
  loading: boolean;
  isOnline: boolean;
  pendingCount: number;
  clearIdentity: () => void;
}

const AuthContext = createContext<AuthContextType>({
  uid: null,
  name: '',
  loading: true,
  isOnline: true,
  pendingCount: 0,
  clearIdentity: () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid]                   = useState<string | null>(null);
  const [name, setName]                 = useState('');
  const [loading, setLoading]           = useState(true);
  const [isOnline, setIsOnline]         = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const interval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const onlineRef = useRef(true);

  const startSync = (userId: string) => {
    if (interval.current) clearInterval(interval.current);
    interval.current = setInterval(async () => {
      if (!onlineRef.current) return;
      await syncPendingToCloud(userId).catch(() => {});
      setPendingCount(getPendingCount());
    }, 15000);
  };

  const stopSync = () => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
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
      migrateOrPull(storedUid)
        .catch(() => {})
        .finally(() => {
          setPendingCount(getPendingCount());
          startSync(storedUid);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      stopSync();
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const clearIdentity = () => {
    stopSync();
    localStorage.removeItem('paisaos_uid');
    localStorage.removeItem('paisaos_username');
    setUid(null);
    setName('');
  };

  return (
    <AuthContext.Provider value={{ uid, name, loading, isOnline, pendingCount, clearIdentity }}>
      {children}
    </AuthContext.Provider>
  );
}
