'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { migrateOrPull, syncPendingToCloud, getPendingCount } from '@/lib/sync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isOnline: boolean;
  pendingCount: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isOnline: true,
  pendingCount: 0,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [session, setSession]         = useState<Session | null>(null);
  const [loading, setLoading]         = useState(true);
  const [isOnline, setIsOnline]       = useState(true);
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
    const goOnline = () => { onlineRef.current = true; setIsOnline(true); };
    const goOffline = () => { onlineRef.current = false; setIsOnline(false); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        migrateOrPull(session.user.id)
          .catch(() => {})
          .finally(() => {
            setPendingCount(getPendingCount());
            startSync(session!.user.id);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await migrateOrPull(session.user.id).catch(() => {});
        setPendingCount(getPendingCount());
        startSync(session.user.id);
      } else {
        stopSync();
        setPendingCount(0);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      stopSync();
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const signOut = async () => {
    if (user && onlineRef.current) {
      await syncPendingToCloud(user.id).catch(() => {});
    }
    stopSync();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isOnline, pendingCount, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
