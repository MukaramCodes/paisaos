import { supabase } from './supabase';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SYNC_KEYS = [
  'paisaos_income',
  'paisaos_assets',
  'paisaos_liabilities',
  'paisaos_spending',
  'paisaos_goals',
  'paisaos_pots',
  'paisaos_flow',
  'paisaos_username',
  'paisaos_visited',
];

const PENDING_KEY    = 'paisaos_pending_sync';
const TIMESTAMPS_KEY = 'paisaos_local_ts';
const MIGRATION_KEY  = 'paisaos_migrated_v1';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingItem {
  key: string;
  raw: string;
  ts:  string;
}

// ─── Local timestamp helpers ──────────────────────────────────────────────────

function getTimestamps(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}'); }
  catch { return {}; }
}

function setTimestamp(key: string, ts: string) {
  const map = getTimestamps();
  map[key] = ts;
  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(map));
}

// ─── Pending queue helpers ────────────────────────────────────────────────────

function getPendingQueue(): PendingItem[] {
  try { return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
  catch { return []; }
}

function enqueuePending(key: string, raw: string, ts: string) {
  const queue = getPendingQueue().filter(i => i.key !== key);
  queue.push({ key, raw, ts });
  localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
}

function clearPendingKeys(keys: string[]) {
  const set = new Set(keys);
  const remaining = getPendingQueue().filter(i => !set.has(i.key));
  localStorage.setItem(PENDING_KEY, JSON.stringify(remaining));
}

export function getPendingCount(): number {
  return getPendingQueue().length;
}

// ─── Write-through save ───────────────────────────────────────────────────────

export function saveLocal(key: string, value: unknown) {
  const raw = typeof value === 'string' ? value : JSON.stringify(value);
  const ts  = new Date().toISOString();
  localStorage.setItem(key, raw);
  setTimestamp(key, ts);
  enqueuePending(key, raw, ts);
}

// ─── Push pending queue to cloud — throws on error ───────────────────────────

export async function syncPendingToCloud(userId: string): Promise<void> {
  const queue = getPendingQueue();
  if (!queue.length) return;

  const rows = queue.map(({ key, raw, ts }) => {
    let value: unknown;
    try { value = JSON.parse(raw); }
    catch { value = { _str: raw }; }
    return { user_id: userId, key, value, updated_at: ts };
  });

  const { error } = await supabase
    .from('user_data')
    .upsert(rows, { onConflict: 'user_id,key' });

  if (error) throw new Error(error.message);
  clearPendingKeys(queue.map(i => i.key));
}

// ─── Pull from cloud (timestamp-based conflict resolution) ───────────────────

export async function pullFromCloud(userId: string): Promise<void> {
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value, updated_at')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  if (!data) return;

  const localTs = getTimestamps();

  for (const row of data) {
    const cloudTs = row.updated_at as string;
    const myTs    = localTs[row.key];
    if (!myTs || cloudTs > myTs) {
      const val = row.value?._str !== undefined
        ? row.value._str
        : JSON.stringify(row.value);
      localStorage.setItem(row.key, val);
      localTs[row.key] = cloudTs;
    }
  }

  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(localTs));
}

// ─── Migration ────────────────────────────────────────────────────────────────

export async function migrateOrPull(userId: string): Promise<void> {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') {
    await syncPendingToCloud(userId);
    await pullFromCloud(userId);
    return;
  }

  const { data: existing, error } = await supabase
    .from('user_data')
    .select('key')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw new Error(error.message);

  if (existing && existing.length > 0) {
    await pullFromCloud(userId);
  } else {
    await pushAllToCloud(userId);
  }

  localStorage.setItem(MIGRATION_KEY, 'done');
}

// ─── Force full sync (bypasses migration flag) ────────────────────────────────

export async function forceSyncAll(userId: string): Promise<{ pushed: number; pulled: number }> {
  // Push everything in localStorage to cloud
  await pushAllToCloud(userId);

  // Pull everything from cloud back
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value, updated_at')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const pulled = data?.length ?? 0;
  const localTs = getTimestamps();

  for (const row of (data ?? [])) {
    const val = row.value?._str !== undefined
      ? row.value._str
      : JSON.stringify(row.value);
    localStorage.setItem(row.key, val);
    localTs[row.key] = row.updated_at as string;
  }

  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(localTs));
  localStorage.setItem(MIGRATION_KEY, 'done');

  return { pushed: SYNC_KEYS.filter(k => localStorage.getItem(k) !== null).length, pulled };
}

// ─── Push all localStorage keys to cloud ─────────────────────────────────────

export async function pushAllToCloud(userId: string): Promise<void> {
  const localTs = getTimestamps();
  const now     = new Date().toISOString();
  const rows: unknown[] = [];

  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    let value: unknown;
    try { value = JSON.parse(raw); }
    catch { value = { _str: raw }; }
    rows.push({ user_id: userId, key, value, updated_at: localTs[key] || now });
  }

  if (!rows.length) return;

  const { error } = await supabase
    .from('user_data')
    .upsert(rows, { onConflict: 'user_id,key' });

  if (error) throw new Error(error.message);
}

// ─── Delete data ──────────────────────────────────────────────────────────────

export async function deleteUserData(userId: string): Promise<void> {
  const { error } = await supabase.from('user_data').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
  _wipeLocalStorage();
}

function _wipeLocalStorage() {
  [...SYNC_KEYS, PENDING_KEY, MIGRATION_KEY, TIMESTAMPS_KEY]
    .forEach(k => localStorage.removeItem(k));
}

export { syncPendingToCloud as pushToCloud };
