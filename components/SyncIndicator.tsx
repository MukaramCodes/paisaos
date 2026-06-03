'use client';

import { useAuth } from '@/components/AuthProvider';
import { Cloud, CloudOff, AlertCircle, RefreshCw } from 'lucide-react';

export default function SyncIndicator() {
  const { isOnline, syncError, pendingCount } = useAuth();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
        <CloudOff size={13} />
        <span>{pendingCount > 0 ? `Offline · ${pendingCount} queued` : 'Offline'}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
        <RefreshCw size={13} className="animate-spin" />
        <span>Syncing {pendingCount}…</span>
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
