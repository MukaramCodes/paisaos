import { supabase } from './supabase';
import { enqueue, getQueue, isLocalId } from './offlineQueue';
import { cacheTxs, getCachedTxs } from './cache';

export type TransactionType =
  | 'income'
  | 'expense'
  | 'loan_received'
  | 'loan_payment'
  | 'adjustment';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  loan_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type TxInput = {
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string;
  loan_id?: string | null;
};

export const INCOME_CATEGORIES = [
  'Salary', 'Business', 'Freelance', 'Cash Received',
  'Bank Transfer', 'Investment Return', 'Gift', 'Other',
];

export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities',
  'Health', 'Education', 'Entertainment', 'Housing', 'Clothing', 'Other',
];

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function addTransaction(userId: string, tx: TxInput): Promise<Transaction> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    // Create a local optimistic record — it will be replaced with the real ID after sync
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const local: Transaction = {
      id: localId, user_id: userId, ...tx,
      loan_id: tx.loan_id ?? null, created_at: now, updated_at: now,
    };
    enqueue({ op: 'addTx', userId, payload: tx, localId });
    cacheTxs(userId, [local, ...getCachedTxs(userId)]);
    return local;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...tx, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  if (!navigator.onLine) {
    return getCachedTxs(userId);
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    // Network failed even though navigator said online — return cache
    return getCachedTxs(userId);
  }

  const synced = data ?? [];

  // Merge any un-synced local transactions still sitting in the queue
  const pending = getQueue()
    .filter(i => i.op === 'addTx' && i.userId === userId && i.localId)
    .map(i => ({
      id: i.localId!,
      user_id: userId,
      ...i.payload,
      loan_id: i.payload.loan_id ?? null,
      created_at: i.createdAt,
      updated_at: i.createdAt,
    } as Transaction));

  const merged = [...pending, ...synced];
  cacheTxs(userId, merged);
  return merged;
}

export async function deleteTransaction(id: string, userId?: string): Promise<void> {
  if (!navigator.onLine) {
    if (isLocalId(id)) {
      // Never synced — remove the matching addTx from queue and cache
      const { dequeue, getQueue: gq } = await import('./offlineQueue');
      const q = gq();
      const entry = q.find(i => i.op === 'addTx' && i.localId === id);
      if (entry) dequeue(entry.id);
    } else if (userId) {
      enqueue({ op: 'deleteTx', userId, payload: { id } });
    }
    if (userId) {
      cacheTxs(userId, getCachedTxs(userId).filter(t => t.id !== id));
    }
    return;
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Calculations ──────────────────────────────────────────────────────────────

export function calcWallet(txs: Transaction[]) {
  let totalIn = 0, totalOut = 0, loanIn = 0, loanOut = 0;
  for (const tx of txs) {
    switch (tx.type) {
      case 'income':        totalIn  += tx.amount; break;
      case 'expense':       totalOut += tx.amount; break;
      case 'loan_received': loanIn   += tx.amount; break;
      case 'loan_payment':  loanOut  += tx.amount; break;
    }
  }
  return {
    balance: totalIn + loanIn - totalOut - loanOut,
    totalIn, totalOut, loanIn, loanOut,
  };
}

export function thisMonthTxs(txs: Transaction[]): Transaction[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return txs.filter(tx => tx.date >= start);
}

export function filterByMonth(txs: Transaction[], ym: string): Transaction[] {
  return txs.filter(tx => tx.date.slice(0, 7) === ym);
}

export function availableMonths(txs: Transaction[]): string[] {
  const set = new Set(txs.map(tx => tx.date.slice(0, 7)));
  return Array.from(set).sort().reverse();
}

export function spendByCategory(txs: Transaction[]): { category: string; amount: number }[] {
  const map: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.type === 'expense') map[tx.category] = (map[tx.category] ?? 0) + tx.amount;
  }
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function dailyAverage(txs: Transaction[]): number {
  const expenses = txs.filter(t => t.type === 'expense');
  if (!expenses.length) return 0;
  const days = new Date().getDate();
  return expenses.reduce((s, t) => s + t.amount, 0) / days;
}

export const fmt = (n: number) =>
  (n < 0 ? '-₨ ' : '₨ ') + Math.abs(Math.round(n)).toLocaleString('en-PK');
