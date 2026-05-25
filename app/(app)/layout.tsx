'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { uid, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !uid) {
      router.replace('/login');
    }
  }, [uid, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center mx-auto mb-3 animate-pulse">
            <span className="text-white font-bold text-lg">₨</span>
          </div>
          <p className="text-sm text-[#40916C] font-medium">Loading PaisaOS…</p>
        </div>
      </div>
    );
  }

  if (!uid) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 min-h-screen bg-[#F4EFE6] pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
