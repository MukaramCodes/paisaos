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
      <div className="min-h-screen bg-[#1B4332] flex items-center justify-center">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="PaisaOS"
            className="w-20 h-20 rounded-2xl mx-auto mb-4 animate-pulse"
          />
          <p className="text-sm text-[#74C69D] font-medium">Loading PaisaOS…</p>
        </div>
      </div>
    );
  }

  if (!uid) return null;

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-60 min-h-screen bg-[#F4EFE6] pt-14 lg:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
