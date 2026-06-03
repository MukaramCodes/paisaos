import { supabase } from './supabase';
import { enqueue, getQueue, isLocalId } from './offlineQueue';
import { cacheLoanData, getCachedLoans } from './cache';

export interface Loan {
  id: string;
  user_id: string;
  lender_name: string;
  loan_amount: number;
  remaining_amount: number;
  paid_amount: number;
  status: 'active' | 'cleared';
  date_taken: string;
  due_date: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export type LoanInput = {
  lender_name: string;
  loan_amount: number;
  date_taken: string;
  due_date?: string;
  note?: string;
};

export async function addLoan(userId: string, input: LoanInput): Promise<Loan> {
  const now = new Date().toISOString();

  if (!navigator.onLine) {
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const local: Loan = {
      id: localId, user_id: userId,
      lender_name: input.lender_name,
      loan_amount: input.loan_amount,
      remaining_amount: input.loan_amount,
      paid_amount: 0, status: 'active',
      date_taken: input.date_taken,
      due_date: input.due_date || null,
      note: input.note || '',
      created_at: now, updated_at: now,
    };
    const payload = {
      lender_name: input.lender_name,
      loan_amount: input.loan_amount,
      remaining_amount: input.loan_amount,
      paid_amount: 0, status: 'active',
      date_taken: input.date_taken,
      due_date: input.due_date || null,
      note: input.note || '',
    };
    enqueue({ op: 'addLoan', userId, payload, localId });
    cacheLoanData(userId, [local, ...getCachedLoans(userId)]);
    return local;
  }

  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: userId,
      lender_name: input.lender_name,
      loan_amount: input.loan_amount,
      remaining_amount: input.loan_amount,
      paid_amount: 0, status: 'active',
      date_taken: input.date_taken,
      due_date: input.due_date || null,
      note: input.note || '',
      created_at: now, updated_at: now,
    })
    .select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getLoans(userId: string): Promise<Loan[]> {
  if (!navigator.onLine) {
    return getCachedLoans(userId);
  }

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('date_taken', { ascending: false });

  if (error) return getCachedLoans(userId);

  const synced = data ?? [];

  // Merge unsynced local loans still in queue
  const pending = getQueue()
    .filter(i => i.op === 'addLoan' && i.userId === userId && i.localId)
    .map(i => ({
      id: i.localId!,
      user_id: userId,
      ...i.payload,
      created_at: i.createdAt,
      updated_at: i.createdAt,
    } as Loan));

  const merged = [...pending, ...synced];
  cacheLoanData(userId, merged);
  return merged;
}

export async function payLoan(loanId: string, payAmount: number, userId?: string): Promise<Loan> {
  if (!navigator.onLine) {
    // Optimistically update the cached loan
    const cached = userId ? getCachedLoans(userId) : [];
    const loan = cached.find(l => l.id === loanId);
    if (!loan) throw new Error('Loan not found in cache');

    const newPaid = loan.paid_amount + payAmount;
    const newRemaining = Math.max(0, loan.remaining_amount - payAmount);
    const updated: Loan = { ...loan, paid_amount: newPaid, remaining_amount: newRemaining, status: newRemaining === 0 ? 'cleared' : 'active', updated_at: new Date().toISOString() };

    enqueue({ op: 'payLoan', userId: userId!, payload: { loanId, payAmount } });
    cacheLoanData(userId!, cached.map(l => l.id === loanId ? updated : l));
    return updated;
  }

  const { data: loan, error: fetchErr } = await supabase
    .from('loans').select('*').eq('id', loanId).single();
  if (fetchErr || !loan) throw new Error(fetchErr?.message ?? 'Loan not found');

  const newPaid      = loan.paid_amount + payAmount;
  const newRemaining = Math.max(0, loan.remaining_amount - payAmount);
  const newStatus    = newRemaining === 0 ? 'cleared' : 'active';

  const { data, error } = await supabase
    .from('loans')
    .update({ paid_amount: newPaid, remaining_amount: newRemaining, status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', loanId).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLoan(id: string, userId?: string): Promise<void> {
  if (!navigator.onLine) {
    if (isLocalId(id)) {
      const { dequeue, getQueue: gq } = await import('./offlineQueue');
      const entry = gq().find(i => i.op === 'addLoan' && i.localId === id);
      if (entry) dequeue(entry.id);
    } else if (userId) {
      enqueue({ op: 'deleteLoan', userId, payload: { id } });
    }
    if (userId) {
      cacheLoanData(userId, getCachedLoans(userId).filter(l => l.id !== id));
    }
    return;
  }

  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
