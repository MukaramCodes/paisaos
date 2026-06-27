'EOF'
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCkUqSyQcJxB2Hq2apQELMn8GeexkPOkXM',
  authDomain: 'paisaos-61108.firebaseapp.com',
  projectId: 'paisaos-61108',
  storageBucket: 'paisaos-61108.firebasestorage.app',
  messagingSenderId: '571231187726',
  appId: '1:571231187726:web:0b85cb6f72aac8f0d6dd5f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

export async function hashKey(name: string, pin: string): Promise<string> {
  const raw = `${name.toLowerCase().trim()}:${pin.trim()}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const LS_KEYS = [
  'paisaos_username', 'paisaos_income', 'paisaos_spending', 'paisaos_goals',
  'paisaos_assets', 'paisaos_liabilities', 'paisaos_savings_pots',
  'paisaos_petrol_fills', 'paisaos_petrol_budget',
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
EOF
