'EOF'
import { db } from './firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

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

const MIGRATION_KEY = 'paisaos_migrated_v1';

export function readSnapshot(): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const k of SYNC_KEYS) snap[k] = localStorage.getItem(k) ?? '';
  return snap;
}

async function pushKeys(uid: string, keys: string[]): Promise<void> {
  const updates: Record<string, string> = {};
  for (const key of keys) {
    const val = localStorage.getItem(key);
    if (val !== null && val !== '') updates[key] = val;
  }
  if (!Object.keys(updates).length) return;
  await setDoc(doc(db, 'user_data', uid), updates, { merge: true });
}

export async function pullFromCloud(uid: string, _force = false): Promise<number> {
  const snap = await getDoc(doc(db, 'user_data', uid));
  if (!snap.exists()) return 0;
  const data = snap.data();
  let count = 0;
  for (const key of SYNC_KEYS) {
    if (data[key] !== undefined && data[key] !== '') {
      localStorage.setItem(key, data[key]);
      count++;
    }
  }
  return count;
}

export async function periodicSync(
  uid: string,
  lastSnapshot: Record<string, string>
): Promise<Record<string, string>> {
  const current = readSnapshot();
  const changed = SYNC_KEYS.filter(k => current[k] !== lastSnapshot[k] && current[k] !== '');
  if (changed.length > 0) await pushKeys(uid, changed);
  await pullFromCloud(uid);
  return current;
}

export async function migrateOrPull(uid: string): Promise<number> {
  if (localStorage.getItem(MIGRATION_KEY) === 'done') {
    return await pullFromCloud(uid);
  }
  const snap = await getDoc(doc(db, 'user_data', uid));
  let pulled = 0;
  if (snap.exists()) {
    pulled = await pullFromCloud(uid, true);
  } else {
    await pushKeys(uid, SYNC_KEYS);
  }
  localStorage.setItem(MIGRATION_KEY, 'done');
  return pulled;
}

export async function forceSyncAll(uid: string): Promise<{ pushed: number; pulled: number }> {
  await pushKeys(uid, SYNC_KEYS);
  const pushed = SYNC_KEYS.filter(k => localStorage.getItem(k) !== null).length;
  const pulled = await pullFromCloud(uid, true);
  localStorage.setItem(MIGRATION_KEY, 'done');
  return { pushed, pulled };
}

export async function deleteUserData(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'user_data', uid));
  SYNC_KEYS.forEach(k => localStorage.removeItem(k));
  localStorage.removeItem(MIGRATION_KEY);
}

export function getPendingCount() { return 0; }
export async function syncPendingToCloud(_uid: string) {}
export { pushKeys as pushToCloud };
EOF