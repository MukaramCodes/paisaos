'use client';

import { useEffect, useState } from 'react';

export default function UpdateBanner() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [worker, setWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWorker(newWorker);
            setShowUpdate(true);
          }
        });
      });
    });
  }, []);

  const handleUpdate = () => {
    if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#1B4332] text-white px-5 py-3 rounded-2xl shadow-2xl">
      <span className="text-sm font-medium">New version available</span>
      <button
        onClick={handleUpdate}
        className="bg-[#74C69D] text-[#1B4332] text-sm font-bold px-4 py-1.5 rounded-xl hover:bg-[#D8F3DC] transition-colors"
      >
        Update now
      </button>
    </div>
  );
}
