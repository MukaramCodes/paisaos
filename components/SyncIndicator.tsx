'use client';

import { useAuth } from '@/components/AuthProvider';
import { Cloud, CloudOff, AlertCircle } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, syncError } = useAuth();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
        <CloudOff size={13} />
        <span>Offline</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-400 font-medium" title={syncError}>
        <AlertCircle size={13} />
        <span>Sync error</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-300">
      <Cloud size={13} />
      <span>Synced</span>
    </div>
  );
}
