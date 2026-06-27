import { supabase } from './supabase';

export type TxType = 'income' | 'expense' | 'loan_received' | 'loan_payment';
export type TransactionType = TxType;
export interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export type TxInput = {
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string;
};

export const INCOME_CATEGORIES = [
  'Salary', 'Business', 'Freelance', 'Cash Received',
  'Bank Transfer', 'Investment Return', 'Gift', 'Other',
];

export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities',
  'Health', 'Education', 'Entertainment', 'Housing', 'Clothing', 'Other',
];

export async function addTransaction(userId: string, tx: TxInput): Promise<Transaction> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...tx, created_at: now, updated_at: now })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export function calcWallet(txs: Transaction[]) {
  let totalIn = 0, totalOut = 0, loanIn = 0, loanOut = 0;
  for (const tx of txs) {
    if (tx.type === 'income') totalIn += tx.amount;
    else if (tx.type === 'expense') totalOut += tx.amount;
    else if (tx.type === 'loan_received') loanIn += tx.amount;
    else if (tx.type === 'loan_payment') loanOut += tx.amount;
  }
  return { balance: totalIn - totalOut, totalIn, totalOut, loanIn, loanOut };
}

export function thisMonthTxs(txs: Transaction[]): Transaction[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  return txs.filter(tx => tx.date >= start);
}

export function availableMonths(txs: Transaction[]): string[] {
  const months = new Set(txs.map(tx => tx.date.slice(0, 7)));
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function filterByMonth(txs: Transaction[], month: string): Transaction[] {
  return txs.filter(tx => tx.date.startsWith(month));
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
  const total = expenses.reduce((s, t) => s + t.amount, 0);
  return total / days;
}

export const fmt = (n: number) =>
  '₨ ' + Math.abs(Math.round(n)).toLocaleString('en-PK');