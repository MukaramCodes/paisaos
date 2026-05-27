'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  getTransactions, addTransaction, deleteTransaction,
  calcWallet, thisMonthTxs, spendByCategory, dailyAverage,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, fmt,
  Transaction,
} from '@/lib/transactions';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2,
  AlertTriangle, RefreshCw, ChevronDown,
} from 'lucide-react';

type Tab = 'all' | 'income' | 'expense';
type FormType = 'income' | 'expense' | null;

const today = () => new Date().toISOString().slice(0, 10);

export default function WalletPage() {
  const { uid } = useAuth();
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<Tab>('all');
  const [form, setForm]       = useState<FormType>(null);

  // Form fields
  const [amount, setAmount]     = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote]         = useState('');
  const [date, setDate]         = useState(today());
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getTransactions(uid);
      setTxs(data);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const openForm = (type: FormType) => {
    setForm(type);
    setAmount(''); setNote(''); setDate(today()); setFormError('');
    setCategory(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFormError('Enter a valid amount.'); return; }
    if (!form) return;
    setSaving(true); setFormError('');
    try {
      const tx = await addTransaction(uid!, { type: form, amount: n, category, note, date });
      setTxs(prev => [tx, ...prev]);
      openForm(null);
      setForm(null);
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setTxs(prev => prev.filter(t => t.id !== id));
    await deleteTransaction(id).catch(() => load());
  };

  const { balance, totalIn, totalOut } = calcWallet(txs);
  const month = thisMonthTxs(txs);
  const { balance: mBalance, totalIn: mIn, totalOut: mOut } = calcWallet(month);
  const dayAvg = dailyAverage(month);
  const topCats = spendByCategory(month).slice(0, 3);
  const overspending = mOut > mIn && mIn > 0;
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

  const visible = txs.filter(t => tab === 'all' ? true : t.type === tab);
  const cats = form === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const txIcon = (type: 'income' | 'expense') =>
    type === 'income' ? '↑' : '↓';

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Wallet</h1>
          <p className="text-sm text-[#40916C] mt-0.5">
            {new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-[#D8F3DC] text-[#40916C] transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">{error}</div>
      )}

      {/* Balance card */}
      <div className="bg-[#1B4332] rounded-2xl p-5 text-white shadow-lg">
        <p className="text-sm text-[#74C69D] font-medium mb-1">Current Balance</p>
        <p className="text-4xl font-extrabold tracking-tight">{fmt(balance)}</p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-[#74C69D]">Total In</p>
            <p className="text-lg font-bold text-white">{fmt(totalIn)}</p>
          </div>
          <div>
            <p className="text-xs text-[#74C69D]">Total Spent</p>
            <p className="text-lg font-bold text-white">{fmt(totalOut)}</p>
          </div>
        </div>
      </div>

      {/* This month stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 border border-[#E8F4ED]">
          <p className="text-xs text-gray-400 mb-1">This month in</p>
          <p className="text-sm font-bold text-[#1B4332]">{fmt(mIn)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#E8F4ED]">
          <p className="text-xs text-gray-400 mb-1">This month out</p>
          <p className="text-sm font-bold text-red-500">{fmt(mOut)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-[#E8F4ED]">
          <p className="text-xs text-gray-400 mb-1">Daily avg</p>
          <p className="text-sm font-bold text-[#1B4332]">{fmt(dayAvg)}</p>
        </div>
      </div>

      {/* Warnings */}
      {overspending && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 font-medium">
            You spent {fmt(mOut - mIn)} more than you earned this month.
          </p>
        </div>
      )}
      {topCats[0] && topCats[0].amount > mOut * 0.5 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            <strong>{topCats[0].category}</strong> is using{' '}
            {Math.round((topCats[0].amount / mOut) * 100)}% of your monthly spending.
          </p>
        </div>
      )}

      {/* Add buttons */}
      {!form && (
        <div className="flex gap-3">
          <button
            onClick={() => openForm('income')}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1B4332] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#2D6A4F] transition-colors"
          >
            <TrendingUp size={16} /> Add Income
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
          >
            <TrendingDown size={16} /> Add Expense
          </button>
        </div>
      )}

      {/* Add form */}
      {form && (
        <div className={`bg-white rounded-2xl border ${form === 'income' ? 'border-[#D8F3DC]' : 'border-red-100'} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold text-sm ${form === 'income' ? 'text-[#1B4332]' : 'text-red-600'}`}>
              {form === 'income' ? '+ Add Income' : '− Add Expense'}
            </h2>
            <button onClick={() => setForm(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (₨)</label>
              <input
                type="number" min="1" step="any"
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0"
                required
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6] font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Category</label>
              <div className="relative">
                <select
                  value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6] appearance-none"
                >
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
                <input
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Note (optional)</label>
                <input
                  type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="e.g. June salary"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
                />
              </div>
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <button
              type="submit" disabled={saving}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-60 ${form === 'income' ? 'bg-[#1B4332] hover:bg-[#2D6A4F]' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {saving ? 'Saving…' : `Save ${form === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </div>
      )}

      {/* Spending breakdown this month */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8F4ED] p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Top Spending This Month</p>
          <div className="space-y-2">
            {topCats.map(({ category: cat, amount: amt }) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{cat}</span>
                    <span className="font-semibold text-[#1B4332]">{fmt(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F4EFE6] rounded-full">
                    <div
                      className="h-1.5 bg-[#40916C] rounded-full"
                      style={{ width: `${Math.min(100, (amt / mOut) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-white rounded-2xl border border-[#E8F4ED] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#E8F4ED]">
          {(['all', 'income', 'expense'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold capitalize transition-colors ${
                tab === t ? 'text-[#1B4332] border-b-2 border-[#1B4332]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-gray-400">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No transactions yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  tx.type === 'income' ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-red-50 text-red-500'
                }`}>
                  {txIcon(tx.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{tx.category}</p>
                  <p className="text-xs text-gray-400">
                    {tx.note ? `${tx.note} · ` : ''}{new Date(tx.date + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${tx.type === 'income' ? 'text-[#1B4332]' : 'text-red-500'}`}>
                  {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                </p>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
