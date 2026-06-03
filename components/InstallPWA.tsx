'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

export default function InstallPWA() {
  const [prompt, setPrompt]       = useState<any>(null);
  const [isIOS, setIsIOS]         = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showHint, setShowHint]   = useState(false);

  useEffect(() => {
    // Already running as an installed PWA — hide everything
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS Safari — no beforeinstallprompt, always show manual instructions
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIsIOS(true);
      return;
    }

    // Check if the prompt was captured before React mounted (by the inline script in layout)
    const early = (window as any).__pwaPrompt;
    if (early) {
      setPrompt(early);
    }

    // Also listen in case it fires after mount
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      (window as any).__pwaPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (installed) return null;

  // iOS — always show manual "Add to Home Screen" guide
  if (isIOS) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowHint(h => !h)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#1B4332] bg-[#D8F3DC] hover:bg-[#b7e4c7] transition-colors"
        >
          <Share size={13} className="flex-shrink-0" />
          Add to Home Screen
        </button>

        {showHint && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1B4332] text-white rounded-2xl p-4 shadow-xl text-xs leading-relaxed z-50">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-bold text-[#74C69D]">Install on iOS</p>
              <button onClick={() => setShowHint(false)} className="text-white/60 hover:text-white flex-shrink-0">
                <X size={14} />
              </button>
            </div>
            <ol className="space-y-1.5 text-white/80">
              <li>1. Tap the <strong className="text-white">Share</strong> button <span className="inline-block bg-white/20 px-1.5 py-0.5 rounded text-[10px]">⬆</span> at the bottom of Safari</li>
              <li>2. Scroll down and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong></li>
              <li>3. Tap <strong className="text-white">Add</strong> — done!</li>
            </ol>
            <p className="mt-2 pt-2 border-t border-white/10 text-white/50">Only works in Safari, not Chrome for iOS</p>
          </div>
        )}
      </div>
    );
  }

  // Android / Chrome / Edge — native install prompt available
  if (prompt) {
    return (
      <button
        onClick={async () => {
          prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === 'accepted') setPrompt(null);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#1B4332] bg-[#D8F3DC] hover:bg-[#b7e4c7] transition-colors"
      >
        <Download size={13} className="flex-shrink-0" />
        Install App
      </button>
    );
  }

  // Browser doesn't support install (Firefox, Safari desktop, etc.) — hide
  return null;
}
