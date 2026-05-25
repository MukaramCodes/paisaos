'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { keyToUserId } from '@/lib/identity';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { setIdentity } = useAuth();
  const [name, setName]       = useState('');
  const [key, setKey]         = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (key.length < 6) { setError('Key must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const trimmedName = name.trim();
      const uid = await keyToUserId(key);
      localStorage.setItem('paisaos_username', trimmedName);
      localStorage.setItem('paisaos_uid', uid);
      setIdentity(uid, trimmedName); // update AuthProvider state directly
      router.replace('/dashboard');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1B4332] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">₨</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">PaisaOS</h1>
          <p className="text-sm text-[#40916C] mt-1">Your personal finance OS for Pakistan</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h2 className="text-base font-bold text-[#1B4332] mb-0.5">Enter PaisaOS</h2>
          <p className="text-xs text-gray-400 mb-5">
            Same key on any device = same data everywhere. Keep it safe.
          </p>

          <form onSubmit={handleEnter} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Mukaram"
                required
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#40916C] transition-colors"
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                This key is your identity — it never leaves your device.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Please wait…' : 'Enter PaisaOS →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            No email. No sign-up. No tracking.
            <br />
            <span className="text-[#40916C] font-medium">Your key = your data.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
