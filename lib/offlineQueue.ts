// Local queue for operations that failed due to being offline.
// Each item is flushed to Supabase when the network returns.

export type QueueItem = {
  id: string;
  op: 'addTx' | 'deleteTx' | 'addLoan' | 'payLoan' | 'deleteLoan';
  userId: string;
  payload: any;
  localId?: string;   // set for add ops so we can replace temp ID with real one
  createdAt: string;
};

const KEY = 'paisaos_offline_queue';
const EVENT = 'paisaos:queue-changed';

export function getQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function save(q: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
  window.dispatchEvent(new Event(EVENT));
}

export function enqueue(item: Omit<QueueItem, 'id' | 'createdAt'>): string {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const q = getQueue();
  q.push({ ...item, id, createdAt: new Date().toISOString() });
  save(q);
  return id;
}

export function dequeue(id: string) {
  save(getQueue().filter(i => i.id !== id));
}

export function queueSize(): number {
  return getQueue().length;
}

export function isLocalId(id: string): boolean {
  return id.startsWith('local_');
}

// Called when network returns — push everything to Supabase
// Returns number of successfully synced items
export async function flushQueue(userId: string): Promise<number> {
  const { supabase } = await import('./supabase');
  const { getCachedTxs, cacheTxs, getCachedLoans, cacheLoanData } = await import('./cache');

  const items = getQueue().filter(i => i.userId === userId);
  if (!items.length) return 0;

  let synced = 0;

  for (const item of items) {
    try {
      if (item.op === 'addTx') {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('transactions')
          .insert({ user_id: userId, ...item.payload, created_at: item.createdAt, updated_at: now })
          .select().single();
        if (error) continue;
        // Replace local ID with real Supabase ID in cache
        if (item.localId) {
          cacheTxs(userId, getCachedTxs(userId).map(t => t.id === item.localId ? data : t));
        }
        dequeue(item.id);
        synced++;

      } else if (item.op === 'deleteTx') {
        if (isLocalId(item.payload.id)) {
          // Was never synced — just drop it
          dequeue(item.id); synced++;
        } else {
          const { error } = await supabase.from('transactions').delete().eq('id', item.payload.id);
          if (error) continue;
          dequeue(item.id); synced++;
        }

      } else if (item.op === 'addLoan') {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('loans')
          .insert({ user_id: userId, ...item.payload, created_at: item.createdAt, updated_at: now })
          .select().single();
        if (error) continue;
        if (item.localId) {
          cacheLoanData(userId, getCachedLoans(userId).map(l => l.id === item.localId ? data : l));
        }
        dequeue(item.id); synced++;

      } else if (item.op === 'payLoan') {
        const { loanId, payAmount } = item.payload;
        if (isLocalId(loanId)) continue; // wait until loan is synced first
        const { data: loan } = await supabase.from('loans').select('*').eq('id', loanId).single();
        if (!loan) continue;
        const newPaid = loan.paid_amount + payAmount;
        const newRemaining = Math.max(0, loan.remaining_amount - payAmount);
        const { error } = await supabase.from('loans').update({
          paid_amount: newPaid,
          remaining_amount: newRemaining,
          status: newRemaining === 0 ? 'cleared' : 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', loanId);
        if (error) continue;
        dequeue(item.id); synced++;

      } else if (item.op === 'deleteLoan') {
        if (isLocalId(item.payload.id)) {
          dequeue(item.id); synced++;
        } else {
          const { error } = await supabase.from('loans').delete().eq('id', item.payload.id);
          if (error) continue;
          dequeue(item.id); synced++;
        }
      }
    } catch {
      // Still offline or transient error — leave in queue, try next time
    }
  }

  return synced;
}
