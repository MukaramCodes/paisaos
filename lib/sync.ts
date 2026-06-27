import { supabase } from './supabase';

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

function getTimestamps(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}'); }
  catch { return {}; }
}

export function readSnapshot(): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const k of SYNC_KEYS) snap[k] = localStorage.getItem(k) ?? '';
  return snap;
}

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

  const ts = getTimestamps();
  for (const key of keys) { if (localStorage.getItem(key)) ts[key] = now; }
  localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(ts));
}

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

export async function periodicSync(
  userId: string,
  lastSnapshot: Record<string, string>
): Promise<Record<string, string>> {
  const current = readSnapshot();
  const changed = SYNC_KEYS.filter(k => current[k] !== lastSnapshot[k] && current[k] !== '');
  if (changed.length > 0) await pushRows(userId, changed);
  await pullFromCloud(userId);
  return current;
}

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

export async function forceSyncAll(userId: string): Promise<{ pushed: number; pulled: number }> {
  await pushRows(userId, SYNC_KEYS);
  const pushed = SYNC_KEYS.filter(k => localStorage.getItem(k) !== null).length;
  const pulled = await pullFromCloud(userId, true);
  localStorage.setItem(MIGRATION_KEY, 'done');
  return { pushed, pulled };
}

export async function deleteUserData(userId: string): Promise<void> {
  const { error } = await supabase.from('user_data').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(MIGRATION_KEY);
  localStorage.removeItem(TIMESTAMPS_KEY);
}

export function getPendingCount() { return 0; }
export async function syncPendingToCloud(_userId: string) {}
export { pushRows as pushToCloud };