import { supabase } from './supabase';

const SYNC_KEYS = [
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

export async function pushToCloud(userId: string) {
  const rows: any[] = [];
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    let value: any;
    try {
      value = JSON.parse(raw);
    } catch {
      value = { _str: raw };
    }
    rows.push({ user_id: userId, key, value, updated_at: new Date().toISOString() });
  }
  if (rows.length === 0) return;
  await supabase.from('user_data').upsert(rows, { onConflict: 'user_id,key' });
}

export async function pullFromCloud(userId: string) {
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value')
    .eq('user_id', userId);

  if (error || !data) return;

  for (const row of data) {
    const val =
      row.value?._str !== undefined
        ? row.value._str
        : JSON.stringify(row.value);
    localStorage.setItem(row.key, val);
  }
}
