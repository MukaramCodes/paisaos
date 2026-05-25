'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { deleteUserData, deleteUserAccount } from '@/lib/sync';
import { User, Trash2, LogOut, AlertTriangle, Shield } from 'lucide-react';
import SyncIndicator from '@/components/SyncIndicator';

type ConfirmMode = null | 'data' | 'account';

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await deleteUserData(user.id);
      setConfirmMode(null);
      router.replace('/dashboard');
    } catch {
      setError('Failed to delete data. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteUserAccount();
      router.replace('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const CONFIRM_PHRASE = 'DELETE';

  return (
    <div className="p-4 lg:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Account</h1>
        <p className="text-sm text-[#40916C] mt-1">Manage your account and data</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8F4ED] mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-[#1B4332]" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1B4332] truncate">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Account ID: {user?.id?.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#E8F4ED] flex items-center justify-between">
          <SyncIndicator />
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>

      {/* Security info */}
      <div className="bg-[#D8F3DC]/40 rounded-2xl p-4 border border-[#D8F3DC] mb-6">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-[#1B4332] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-[#2D6A4F] leading-relaxed">
            <p className="font-semibold mb-1">Your data is private</p>
            <p>Row-level security ensures only you can read or write your data. No one else — including admins — can access your financial records without your credentials.</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 overflow-hidden">
        <div className="px-5 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Danger Zone</p>
        </div>

        {/* Delete data */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Delete my data</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Removes all your financial records from the cloud and this device. Your account stays active.
              </p>
            </div>
            <button
              onClick={() => { setConfirmMode('data'); setConfirmText(''); setError(''); }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete data
            </button>
          </div>

          {confirmMode === 'data' && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500" />
                <p className="text-xs font-semibold text-red-600">
                  This will permanently delete all your financial data. Type <strong>{CONFIRM_PHRASE}</strong> to confirm.
                </p>
              </div>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white mb-3"
              />
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteData}
                  disabled={confirmText !== CONFIRM_PHRASE || loading}
                  className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Deleting…' : 'Yes, delete all my data'}
                </button>
                <button
                  onClick={() => setConfirmMode(null)}
                  className="px-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete account */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Delete my account</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Permanently removes all your data and deletes your account. Cannot be undone.
              </p>
            </div>
            <button
              onClick={() => { setConfirmMode('account'); setConfirmText(''); setError(''); }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete account
            </button>
          </div>

          {confirmMode === 'account' && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-600">
                  This permanently deletes your account, all data, and cannot be reversed. Type <strong>{CONFIRM_PHRASE}</strong> to confirm.
                </p>
              </div>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white mb-3"
              />
              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== CONFIRM_PHRASE || loading}
                  className="flex-1 bg-red-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Deleting account…' : 'Yes, delete my account permanently'}
                </button>
                <button
                  onClick={() => setConfirmMode(null)}
                  className="px-3 text-xs text-gray-500 hover:text-gray-700"
                >
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
