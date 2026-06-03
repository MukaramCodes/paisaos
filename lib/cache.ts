// Simple per-user localStorage cache so reads work while offline
import type { Transaction } from './transactions';
import type { Loan } from './loans';

const txKey   = (uid: string) => `paisaos_cache_txs_${uid}`;
const loanKey = (uid: string) => `paisaos_cache_loans_${uid}`;

export function cacheTxs(uid: string, txs: Transaction[]) {
  try { localStorage.setItem(txKey(uid), JSON.stringify(txs)); } catch {}
}
export function getCachedTxs(uid: string): Transaction[] {
  try { return JSON.parse(localStorage.getItem(txKey(uid)) || '[]'); } catch { return []; }
}

export function cacheLoanData(uid: string, loans: Loan[]) {
  try { localStorage.setItem(loanKey(uid), JSON.stringify(loans)); } catch {}
}
export function getCachedLoans(uid: string): Loan[] {
  try { return JSON.parse(localStorage.getItem(loanKey(uid)) || '[]'); } catch { return []; }
}
