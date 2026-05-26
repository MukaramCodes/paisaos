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

const TIMESTAMPS_KEY = 'paisaos_local_ts';
const MIGRATION_KEY  = 'paisaos_migrated_v1';

// ─── Timestamp helpers ────────────────────────────────────────────────────────

function getTimestamps(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}'); }
  catch { return {}; }
}

// ─── Read snapshot of all sync keys ──────────────────────────────────────────

export function readSnapshot(): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const k of SYNC_KEYS) snap[k] = localStorage.getItem(k) ?? '';
  return snap;
}

// ─── Push a specific set of key/value pairs with a fresh timestamp ────────────

async function pushRows(userId: string, keys: string[]): Promise<void> {
  const now  = new Date().toISOString();
  const rows: unknown[] = [];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') continue;
    let value: unknown;
    try { value = JSON.parse(raw); }
    catch { value = { _str: raw }; }
    rows.push({ user_id: userId, key, value, updated_at: now });
  }

  if (!rows.length) return;

  const { error } = await supabase
    .from('user_data')
    .upsert(rows, { onConflict: 'user_id,key' });

  if (error) throw new Error(error.message);

  // Update local timestamps so next interval doesn't re-push unchanged keys
  const ts = getTimestamps();
  for (const key of keys) { if (localStorage.getItem(key)) ts[key] = now; }
  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(ts));
}

// ─── Pull from cloud ──────────────────────────────────────────────────────────

export async function pullFromCloud(userId: string, force = false): Promise<number> {
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value, updated_at')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  if (!data) return 0;

  const localTs = getTimestamps();
  let count = 0;

  for (const row of data) {
    const cloudTs = row.updated_at as string;
    const myTs    = localTs[row.key];

    if (force || !myTs || cloudTs > myTs) {
      const val = row.value?._str !== undefined
        ? row.value._str
        : JSON.stringify(row.value);
      localStorage.setItem(row.key, val);
      localTs[row.key] = cloudTs;
      count++;
    }
  }

  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(localTs));
  return count;
}

// ─── Periodic sync: compare snapshot, push changed keys, pull ─────────────────

export async function periodicSync(
  userId: string,
  lastSnapshot: Record<string, string>
): Promise<Record<string, string>> {
  const current = readSnapshot();

  // Find keys whose value changed since last snapshot
  const changed = SYNC_KEYS.filter(k => current[k] !== lastSnapshot[k] && current[k] !== '');

  if (changed.length > 0) {
    await pushRows(userId, changed);
  }

  // Always pull to pick up changes from other devices
  await pullFromCloud(userId);

  return current; // caller stores this as new snapshot
}

// ─── First-login migration ────────────────────────────────────────────────────

export async function migrateOrPull(userId: string): Promise<number> {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') {
    return await pullFromCloud(userId);
  }

  const { data: existing, error } = await supabase
    .from('user_data')
    .select('key')
    .eq('user_id', userId)
    .limit(1);

  if (error) throw new Error(error.message);

  let pulled = 0;
  if (existing && existing.length > 0) {
    pulled = await pullFromCloud(userId, true);
  } else {
    await pushRows(userId, SYNC_KEYS);
  }

  localStorage.setItem(MIGRATION_KEY, 'done');
  return pulled;
}

// ─── Force full sync (manual button) ─────────────────────────────────────────

export async function forceSyncAll(userId: string): Promise<{ pushed: number; pulled: number }> {
  // Push ALL keys with a fresh NOW timestamp (guarantees other devices see it as new)
  await pushRows(userId, SYNC_KEYS);
  const pushed = SYNC_KEYS.filter(k => localStorage.getItem(k) !== null).length;

  // Force-pull everything (overwrite local, no timestamp check)
  const pulled = await pullFromCloud(userId, true);

  localStorage.setItem(MIGRATION_KEY, 'done');
  return { pushed, pulled };
}

// ─── Delete data ──────────────────────────────────────────────────────────────

export async function deleteUserData(userId: string): Promise<void> {
  const { error } = await supabase.from('user_data').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(MIGRATION_KEY);
  localStorage.removeItem(TIMESTAMPS_KEY);
}

// ─── Backward-compat ──────────────────────────────────────────────────────────

export function getPendingCount() { return 0; }
export async function syncPendingToCloud(_userId: string) { /* replaced by periodicSync */ }
export { pushRows as pushToCloud };
