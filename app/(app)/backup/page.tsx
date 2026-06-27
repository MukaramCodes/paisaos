'use client';

import { useState, useEffect } from 'react';
import { CloudUpload, CloudDownload, ShieldCheck, KeyRound, User, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase, hashKey, collectLocalData, restoreLocalData } from '@/lib/supabase';

type Mode = 'idle' | 'backup' | 'restore';
type Status = 'idle' | 'loading' | 'success' | 'error';

export default function BackupPage() {
  const [mode, setMode] = useState<Mode>('idle');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('paisaos_username') || '';
    setName(savedName);
    const savedBackup = localStorage.getItem('paisaos_last_backup');
    if (savedBackup) setLastBackup(savedBackup);
    setMounted(true);
  }, []);

  const reset = () => {
    setStatus('idle');
    setMessage('');
    setPin('');
    setMode('idle');
  };

  const handleBackup = async () => {
    if (!name.trim() || !pin.trim()) {
      setMessage('Please enter your name and a PIN.');
      setStatus('error');
      return;
    }
    if (pin.length < 4) {
      setMessage('PIN must be at least 4 characters.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const userKey = await hashKey(name, pin);
      const data = collectLocalData();

      const { error } = await supabase
        .from('paisaos_backups')
        .upsert(
          {
            user_key: userKey,
            user_name: name.trim(),
            data,
          },
          { onConflict: 'user_key' }
        );

      if (error) throw error;

      const now = new Date().toLocaleString('en-PK');
      localStorage.setItem('paisaos_last_backup', now);
      setLastBackup(now);
      setStatus('success');
      setMessage(`Data backed up to cloud! Remember your name "${name.trim()}" and PIN to restore on any device.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Backup failed. Check your internet connection.');
    }
  };

  const handleRestore = async () => {
    if (!name.trim() || !pin.trim()) {
      setMessage('Please enter your name and PIN.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const userKey = await hashKey(name, pin);

      const { data: rows, error } = await supabase
        .from('paisaos_backups')
        .select('data, user_name, updated_at')
        .eq('user_key', userKey)
        .single();

      if (error || !rows) {
        setStatus('error');
        setMessage('No backup found for this name + PIN. Check your credentials and try again.');
        return;
      }

      restoreLocalData(rows.data);
      const now = new Date().toLocaleString('en-PK');
      localStorage.setItem('paisaos_last_backup', now);
      setLastBackup(now);
      setStatus('success');
      setMessage(`Data restored for "${rows.user_name}"! Refresh the app to see your data.`);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Restore failed. Check your internet connection.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332] flex items-center gap-2">
          <ShieldCheck size={24} className="text-[#40916C]" /> Cloud Backup
        </h1>
        <p className="text-sm text-[#40916C] mt-1">
          Back up your PaisaOS data to the cloud and restore it on any device
        </p>
      </div>

      {/* Where data is saved — info card */}
      <div className="bg-[#D8F3DC] rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#1B4332] flex items-center justify-center flex-shrink-0">
          <CloudUpload size={18} className="text-[#74C69D]" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1B4332]">Where your data is saved</p>
          <p className="text-xs text-[#2D6A4F] mt-1 leading-relaxed">
            Your data is stored in <span className="font-semibold">Supabase</span> (cloud database) in the{' '}
            <span className="font-mono bg-white/60 px-1 rounded">paisaos_backups</span> table at{' '}
            <span className="font-mono bg-white/60 px-1 rounded">wvcmkpwancdsbljsutjx.supabase.co</span>.
            Your name and a hashed version of your PIN are used as the key — your PIN is never stored in plaintext.
          </p>
          {lastBackup && (
            <p className="text-xs text-[#1B4332] font-semibold mt-2">Last backup: {lastBackup}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {mode === 'idle' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('backup')}
            className="bg-[#1B4332] text-white rounded-2xl p-6 text-left hover:bg-[#2D6A4F] transition-colors group"
          >
            <CloudUpload size={28} className="text-[#74C69D] mb-3" />
            <p className="font-bold text-lg">Backup to Cloud</p>
            <p className="text-sm text-[#D8F3DC] mt-1">Save all your current data securely to the cloud</p>
          </button>
          <button
            onClick={() => setMode('restore')}
            className="bg-white border-2 border-[#D8F3DC] rounded-2xl p-6 text-left hover:bg-[#F4EFE6] transition-colors group"
          >
            <CloudDownload size={28} className="text-[#40916C] mb-3" />
            <p className="font-bold text-lg text-[#1B4332]">Restore from Cloud</p>
            <p className="text-sm text-gray-500 mt-1">Load your saved data onto this device</p>
          </button>
        </div>
      )}

      {/* Form */}
      {(mode === 'backup' || mode === 'restore') && (
        <div className="bg-white rounded-2xl p-6 shadow-card space-y-5">
          <div className="flex items-center gap-3 mb-2">
            {mode === 'backup' ? (
              <CloudUpload size={20} className="text-[#1B4332]" />
            ) : (
              <CloudDownload size={20} className="text-[#40916C]" />
            )}
            <h3 className="font-bold text-[#1B4332] text-lg">
              {mode === 'backup' ? 'Backup your data' : 'Restore your data'}
            </h3>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
              <User size={11} /> Your Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-[#D8F3DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
            />
            <p className="text-xs text-gray-400 mt-1">Use the same name each time to access your backup</p>
          </div>

          {/* PIN */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block flex items-center gap-1">
              <KeyRound size={11} /> Backup PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Create a PIN (min 4 chars)"
                className="w-full border border-[#D8F3DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6] pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {mode === 'backup'
                ? 'Remember this PIN — you need it to restore your data'
                : 'Enter the same PIN you used when backing up'}
            </p>
          </div>

          {/* Status message */}
          {status === 'error' && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-start gap-2 bg-[#D8F3DC] text-[#1B4332] rounded-xl px-4 py-3 text-sm">
              <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={reset}
              className="flex-1 py-3 border border-[#D8F3DC] rounded-xl text-sm font-medium text-gray-500 hover:bg-[#F4EFE6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={mode === 'backup' ? handleBackup : handleRestore}
              disabled={status === 'loading'}
              className="flex-1 py-3 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {mode === 'backup' ? 'Saving…' : 'Restoring…'}
                </>
              ) : mode === 'backup' ? (
                <>
                  <CloudUpload size={15} /> Save to Cloud
                </>
              ) : (
                <>
                  <CloudDownload size={15} /> Restore Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* What gets backed up */}
      <div className="bg-white rounded-2xl p-5 shadow-card">
        <h3 className="font-bold text-[#1B4332] mb-3">What gets backed up</h3>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            'Your name & monthly income',
            'Spending Autopsy categories',
            'Goals & their progress',
            'Assets & liabilities',
            'Savings pots',
            'Petrol fill-ups & budget',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 size={14} className="text-[#40916C] flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="text-center text-xs text-gray-400 px-4">
        <ShieldCheck size={14} className="inline mr-1 text-gray-300" />
        Your PIN is hashed with SHA-256 before reaching the server — it is never stored in plaintext.
        Use a unique PIN you can remember.
      </div>
    </div>
  );
}
