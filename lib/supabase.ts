import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://wvcmkpwancdsbljsutjx.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_ASoow2xe9Yh-b4YeyJagYg_plz4jzrw';

export const supabase = createClient(url, key);

// Hash a string using SHA-256 (Web Crypto API — browser only)
export async function hashKey(name: string, pin: string): Promise<string> {
  const raw = `${name.toLowerCase().trim()}:${pin.trim()}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// All localStorage keys that belong to PaisaOS
export const LS_KEYS = [
  'paisaos_username',
  'paisaos_income',
  'paisaos_spending',
  'paisaos_goals',
  'paisaos_assets',
  'paisaos_liabilities',
  'paisaos_savings_pots',
  'paisaos_petrol_fills',
  'paisaos_petrol_budget',
] as const;

export type BackupData = Record<string, string>;

export function collectLocalData(): BackupData {
  const data: BackupData = {};
  for (const key of LS_KEYS) {
    const val = localStorage.getItem(key);
    if (val) data[key] = val;
  }
  return data;
}

export function restoreLocalData(data: BackupData) {
  for (const key of LS_KEYS) {
    if (data[key] !== undefined) {
      localStorage.setItem(key, data[key]);
    }
  }
}
