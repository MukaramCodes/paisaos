import { supabase } from './supabase';

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
  const { data, error } = await supabase
    .from('loans')
    .insert({
      user_id: userId,
      lender_name: input.lender_name,
      loan_amount: input.loan_amount,
      remaining_amount: input.loan_amount,
      paid_amount: 0,
      status: 'active',
      date_taken: input.date_taken,
      due_date: input.due_date || null,
      note: input.note || '',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getLoans(userId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('date_taken', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function payLoan(loanId: string, payAmount: number): Promise<Loan> {
  const { data: loan, error: fetchErr } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
  if (fetchErr || !loan) throw new Error(fetchErr?.message ?? 'Loan not found');

  const newPaid      = loan.paid_amount + payAmount;
  const newRemaining = Math.max(0, loan.remaining_amount - payAmount);
  const newStatus    = newRemaining === 0 ? 'cleared' : 'active';

  const { data, error } = await supabase
    .from('loans')
    .update({
      paid_amount:      newPaid,
      remaining_amount: newRemaining,
      status:           newStatus,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', loanId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLoan(id: string): Promise<void> {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
