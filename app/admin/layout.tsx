'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.app_metadata?.role === 'admin';

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && !isAdmin) router.replace('/dashboard');
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#1B4332] animate-pulse flex items-center justify-center">
          <span className="text-white font-bold text-sm">₨</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center">
            <span className="text-white font-bold text-sm">₨</span>
          </div>
          <div>
            <span className="font-bold text-white">PaisaOS</span>
            <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
              Admin
            </span>
          </div>
        </div>
        <span className="text-xs text-gray-500">{user.email}</span>
      </header>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
