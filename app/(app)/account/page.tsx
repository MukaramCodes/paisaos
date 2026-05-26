'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { deleteUserData, forceSyncAll } from '@/lib/sync';
import { KeyRound, Trash2, AlertTriangle, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';

export default function AccountPage() {
  const { uid, name, syncError, clearIdentity } = useAuth();
  const router = useRouter();

  const [confirm, setConfirm]       = useState(false);
  const [text, setText]             = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [copied, setCopied]         = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncResultErr, setSyncResultErr] = useState<string | null>(null);

  const copyUid = async () => {
    if (!uid) return;
    try {
      await navigator.clipboard.writeText(uid);
    } catch {
      const el = document.getElementById('uid-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleForceSync = async () => {
    if (!uid) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncResultErr(null);
    try {
      const { pushed, pulled } = await forceSyncAll(uid);
      setSyncResult(`Done — pushed ${pushed} keys, pulled ${pulled} records from cloud.`);
    } catch (e: any) {
      setSyncResultErr(e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteData = async () => {
    if (!uid) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteUserData(uid);
      clearIdentity();
      router.replace('/login');
    } catch {
      setDeleteError('Failed to delete data. Try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Account</h1>
        <p className="text-sm text-[#40916C] mt-1">Your identity and data</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8F4ED] mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
            <span className="text-[#1B4332] font-bold text-lg">{name ? name.slice(0, 2).toUpperCase() : '?'}</span>
          </div>
          <div>
            <p className="font-bold text-[#1B4332]">{name || 'Unknown'}</p>
            <p className="text-xs text-gray-400">Your Cloud ID</p>
          </div>
        </div>

        {/* Full UID — selectable + copy button */}
        <div className="bg-[#F4EFE6] rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
          <p id="uid-text" className="flex-1 text-xs font-mono text-gray-600 break-all select-all">
            {uid}
          </p>
          <button
            onClick={copyUid}
            className="flex-shrink-0 p-1.5 rounded-lg bg-white border border-[#D8F3DC] text-gray-400 hover:text-[#1B4332] transition-colors"
          >
            {copied ? <Check size={14} className="text-[#40916C]" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Sync status */}
        {syncError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-600">Sync error — data not reaching cloud</p>
                <p className="text-xs text-red-400 mt-0.5 font-mono break-all">{syncError}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Force sync button */}
        <button
          onClick={handleForceSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#D8F3DC] text-sm font-semibold text-[#1B4332] hover:bg-[#D8F3DC]/40 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing…' : 'Force sync now'}
        </button>

        {syncResult && (
          <p className="text-xs text-[#40916C] mt-2 text-center">{syncResult}</p>
        )}
        {syncResultErr && (
          <div className="mt-2 bg-red-50 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-red-600">Sync failed:</p>
            <p className="text-xs text-red-400 font-mono break-all mt-0.5">{syncResultErr}</p>
          </div>
        )}
      </div>

      {/* Key info */}
      <div className="bg-[#D8F3DC]/40 rounded-2xl p-4 border border-[#D8F3DC] mb-6">
        <div className="flex items-start gap-3">
          <KeyRound size={16} className="text-[#1B4332] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#2D6A4F] leading-relaxed">
            <p className="font-semibold mb-1">Your key = your identity</p>
            <p>Use the same key on any device to access your data. If you lose your key, enter the same key again anywhere to restore it from the cloud.</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Danger Zone</p>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Delete all my data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permanently removes all records from cloud and this device.
              </p>
            </div>
            <button
              onClick={() => { setConfirm(true); setText(''); setDeleteError(''); }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>

          {confirm && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-xs font-semibold text-red-600">
                  Type <strong>DELETE</strong> to confirm. Cannot be undone.
                </p>
              </div>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="DELETE"
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white mb-3"
              />
              {deleteError && <p className="text-xs text-red-500 mb-2">{deleteError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteData}
                  disabled={text !== 'DELETE' || deleting}
                  className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete everything'}
                </button>
                <button onClick={() => setConfirm(false)} className="px-3 text-xs text-gray-500 hover:text-gray-700">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
