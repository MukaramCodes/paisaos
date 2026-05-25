'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { pullFromCloud, pushToCloud } from '@/lib/sync';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSync = (userId: string) => {
    if (interval.current) clearInterval(interval.current);
    interval.current = setInterval(() => {
      pushToCloud(userId).catch(() => {});
    }, 15000);
  };

  const stopSync = () => {
    if (interval.current) { clearInterval(interval.current); interval.current = null; }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        pullFromCloud(session.user.id)
          .catch(() => {})
          .finally(() => { startSync(session!.user.id); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await pullFromCloud(session.user.id).catch(() => {});
        startSync(session.user.id);
      } else {
        stopSync();
      }
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); stopSync(); };
  }, []);

  const signOut = async () => {
    if (user) await pushToCloud(user.id).catch(() => {});
    stopSync();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
