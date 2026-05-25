'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Database, RefreshCw, Trash2, ShieldOff, Bell } from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  record_count: number;
}

interface Stats {
  total_users: number;
  total_records: number;
}

export default function AdminPage() {
  const [users, setUsers]         = useState<AppUser[]>([]);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.rpc('admin_get_users');
      if (error) throw error;
      setUsers(data?.users ?? []);
      setStats(data?.stats ?? null);

      // Load current announcement
      const { data: cfg } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'announcement')
        .single();
      if (cfg) setAnnouncement(cfg.value);
    } catch (e: any) {
      setError(e.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveAnnouncement = async () => {
    setSaving(true);
    await supabase
      .from('app_config')
      .upsert({ key: 'announcement', value: announcement, updated_at: new Date().toISOString() });
    setSaving(false);
  };

  const deleteUserData = async (userId: string) => {
    await supabase.from('user_data').delete().eq('user_id', userId);
    setDeleteTarget(null);
    load();
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Manage users and app configuration</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-1">
              <Users size={18} className="text-[#40916C]" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Users</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_users}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-1">
              <Database size={18} className="text-[#40916C]" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Cloud Records</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_records}</p>
          </div>
        </div>
      )}

      {/* Announcement banner */}
      <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-yellow-400" />
          <p className="text-sm font-semibold text-white">App Announcement</p>
          <span className="text-xs text-gray-500">— shown to all users at top of dashboard</span>
        </div>
        <textarea
          value={announcement}
          onChange={e => setAnnouncement(e.target.value)}
          placeholder="Leave empty to hide. Example: 🎉 New feature: Goals tracking is live!"
          rows={2}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#40916C] resize-none"
        />
        <button
          onClick={saveAnnouncement}
          disabled={saving}
          className="mt-2 px-4 py-1.5 bg-[#1B4332] text-white text-xs font-semibold rounded-lg hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save announcement'}
        </button>
      </div>

      {/* Users table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">All Users</p>
          <button onClick={load} className="text-gray-400 hover:text-white transition-colors">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div className="px-5 py-4 text-sm text-red-400 bg-red-900/20">{error}</div>
        )}

        {loading ? (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-500 text-sm">No users yet</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {users.map(u => (
              <div key={u.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1B4332]/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#74C69D] font-bold text-xs">
                    {u.email.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.email}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Joined {fmt(u.created_at)} · Last seen {fmt(u.last_sign_in_at)} · {u.record_count} records
                  </p>
                </div>
                {deleteTarget === u.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400">Delete their data?</span>
                    <button
                      onClick={() => deleteUserData(u.id)}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteTarget(u.id)}
                    title="Delete user data"
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
