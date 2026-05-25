'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Account created! Check your email to confirm, then log in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Try again.');
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
          {/* Tabs */}
          <div className="flex bg-[#F4EFE6] rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m ? 'bg-white text-[#1B4332] shadow-sm' : 'text-[#40916C] hover:text-[#1B4332]'
                }`}
              >
                {m === 'login' ? 'Login' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-xs text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#D8F3DC] border border-[#74C69D] rounded-xl px-3 py-2.5 text-xs text-[#1B4332]">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Login to PaisaOS' : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
            Your data is private and encrypted.
            <br />
            <span className="text-[#40916C] font-medium">No bank linking required.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
