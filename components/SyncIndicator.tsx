'use client';

import { useAuth } from '@/components/AuthProvider';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, pendingCount, syncError } = useAuth();

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

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#40916C] font-medium">
        <RefreshCw size={12} className="animate-spin" />
        <span>Syncing {pendingCount} change{pendingCount > 1 ? 's' : ''}…</span>
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
