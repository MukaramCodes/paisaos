'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  getTransactions, addTransaction, deleteTransaction,
  calcWallet, thisMonthTxs, spendByCategory, dailyAverage,
  filterByMonth, availableMonths,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, fmt,
  Transaction, TransactionType,
} from '@/lib/transactions';
import { getLoans, addLoan, payLoan, deleteLoan, Loan } from '@/lib/loans';
import {
  TrendingUp, TrendingDown, AlertTriangle, RefreshCw,
  ChevronDown, Trash2, CreditCard, CheckCircle,
} from 'lucide-react';

type Tab      = 'all' | 'income' | 'expense';
type FormMode = 'income' | 'expense' | 'loan' | 'pay_loan' | null;

const todayStr = () => new Date().toISOString().slice(0, 10);

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
}

const TX_STYLE: Record<TransactionType, { icon: string; bg: string; text: string; tag: string }> = {
  income:        { icon: '↑', bg: 'bg-[#D8F3DC]', text: 'text-[#1B4332]',  tag: '' },
  expense:       { icon: '↓', bg: 'bg-red-50',    text: 'text-red-500',     tag: '' },
  loan_received: { icon: '←', bg: 'bg-blue-50',   text: 'text-blue-600',   tag: 'Loan In' },
  loan_payment:  { icon: '→', bg: 'bg-orange-50', text: 'text-orange-600', tag: 'Loan Pay' },
  adjustment:    { icon: '~', bg: 'bg-gray-100',  text: 'text-gray-500',   tag: 'Adj' },
};

export default function WalletPage() {
  const { uid } = useAuth();
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [loans, setLoans]     = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<Tab>('all');
  const [histMonth, setHistMonth] = useState('');
  const [form, setForm]       = useState<FormMode>(null);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);

  const [amount, setAmount]         = useState('');
  const [category, setCategory]     = useState('');
  const [customCat, setCustomCat]   = useState('');
  const [note, setNote]             = useState('');
  const [date, setDate]             = useState(todayStr());

  const [lenderName, setLenderName]       = useState('');
  const [loanAmt, setLoanAmt]             = useState('');
  const [loanDate, setLoanDate]           = useState(todayStr());
  const [loanDue, setLoanDue]             = useState('');
  const [loanNote, setLoanNote]           = useState('');
  const [loanToWallet, setLoanToWallet]   = useState(true);

  const [payAmt, setPayAmt]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [txData, loanData] = await Promise.all([getTransactions(uid), getLoans(uid)]);
      setTxs(txData);
      setLoans(loanData);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load]);

  const CUSTOM = '__custom__';

  const openForm = (mode: FormMode, loan?: Loan) => {
    setForm(mode); setFormError('');
    setAmount(''); setNote(''); setDate(todayStr()); setCustomCat('');
    if (mode === 'income')  setCategory(INCOME_CATEGORIES[0]);
    if (mode === 'expense') setCategory(EXPENSE_CATEGORIES[0]);
    if (mode === 'loan') {
      setLenderName(''); setLoanAmt(''); setLoanDate(todayStr());
      setLoanDue(''); setLoanNote(''); setLoanToWallet(true);
    }
    if (mode === 'pay_loan' && loan) {
      setActiveLoan(loan);
      setPayAmt(''); // user enters partial amount themselves
    }
  };

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFormError('Enter a valid amount.'); return; }
    if (form !== 'income' && form !== 'expense') return;
    const finalCategory = category === CUSTOM
      ? (customCat.trim() || 'Other')
      : category;
    setSaving(true); setFormError('');
    try {
      const tx = await addTransaction(uid!, { type: form, amount: n, category: finalCategory, note, date });
      setTxs(prev => [tx, ...prev]);
      setForm(null);
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(loanAmt);
    if (!lenderName.trim() || !n || n <= 0) { setFormError('Enter lender name and amount.'); return; }
    setSaving(true); setFormError('');
    try {
      const loan = await addLoan(uid!, {
        lender_name: lenderName.trim(), loan_amount: n,
        date_taken: loanDate, due_date: loanDue || undefined, note: loanNote,
      });
      setLoans(prev => [loan, ...prev]);
      if (loanToWallet) {
        const tx = await addTransaction(uid!, {
          type: 'loan_received', amount: n, category: 'Loan Received',
          note: `From ${lenderName.trim()}${loanNote ? ` – ${loanNote}` : ''}`,
          date: loanDate, loan_id: loan.id,
        });
        setTxs(prev => [tx, ...prev]);
      }
      setForm(null);
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handlePayLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(payAmt);
    if (!n || n <= 0 || !activeLoan) { setFormError('Enter a valid amount.'); return; }
    if (n > activeLoan.remaining_amount + 0.01) {
      setFormError(`Max: ${fmt(activeLoan.remaining_amount)}`); return;
    }
    setSaving(true); setFormError('');
    try {
      const tx = await addTransaction(uid!, {
        type: 'loan_payment', amount: n, category: 'Loan Payment',
        note: `To ${activeLoan.lender_name}`, date: todayStr(), loan_id: activeLoan.id,
      });
      setTxs(prev => [tx, ...prev]);
      const updated = await payLoan(activeLoan.id, n);
      setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
      setForm(null); setActiveLoan(null);
    } catch (e: any) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  // Pay the full remaining amount in one click — no form needed
  const handlePayFull = async (loan: Loan) => {
    if (saving) return;
    setSaving(true);
    try {
      const tx = await addTransaction(uid!, {
        type: 'loan_payment', amount: loan.remaining_amount, category: 'Loan Payment',
        note: `To ${loan.lender_name} (full)`, date: todayStr(), loan_id: loan.id,
      });
      setTxs(prev => [tx, ...prev]);
      const updated = await payLoan(loan.id, loan.remaining_amount);
      setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteTx = async (id: string) => {
    setTxs(prev => prev.filter(t => t.id !== id));
    await deleteTransaction(id).catch(() => load());
  };

  const handleDeleteLoan = async (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    await deleteLoan(id).catch(() => load());
  };

  // ── Balance = THIS MONTH only. Previous months stay in history only.
  const month = thisMonthTxs(txs);
  const { balance, totalIn: mIn, totalOut: mOut, loanIn: mLoanIn, loanOut: mLoanOut } = calcWallet(month);
  const dayAvg  = dailyAverage(month);
  const topCats = spendByCategory(month).slice(0, 3);
  const overspending = mOut > mIn && mIn > 0;

  const activeLoans    = loans.filter(l => l.status === 'active');
  const clearedLoans   = loans.filter(l => l.status === 'cleared');
  const totalRemaining = activeLoans.reduce((s, l) => s + l.remaining_amount, 0);

  const months = availableMonths(txs);
  const histTxs = histMonth ? filterByMonth(txs, histMonth) : txs;
  const visible = histTxs.filter(t =>
    tab === 'income'  ? t.type === 'income'  :
    tab === 'expense' ? t.type === 'expense' : true
  );
  const cats = form === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

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

      {/* Balance card — this month only; red if overdrawn */}
      <div className={`rounded-2xl p-5 text-white shadow-lg ${balance < 0 ? 'bg-red-600' : 'bg-[#1B4332]'}`}>
        <p className={`text-xs font-semibold mb-0.5 ${balance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>
          {balance < 0 ? '⚠ Overdrawn This Month' : 'This Month\'s Balance'}
        </p>
        <p className="text-4xl font-extrabold tracking-tight">{fmt(balance)}</p>
        <p className={`text-xs mt-1 mb-3 ${balance < 0 ? 'text-red-200' : 'text-[#74C69D]/70'}`}>
          Resets each month · previous months in history
        </p>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
          <div>
            <p className={`text-xs ${balance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>Income</p>
            <p className="text-sm font-bold">{fmt(mIn)}</p>
          </div>
          <div>
            <p className="text-xs text-red-300">Expenses</p>
            <p className="text-sm font-bold">{fmt(mOut)}</p>
          </div>
          <div>
            <p className={`text-xs ${balance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>Daily avg</p>
            <p className="text-sm font-bold">{fmt(dayAvg)}</p>
          </div>
          {mLoanIn > 0 && (
            <div>
              <p className="text-xs text-blue-200">Loan In</p>
              <p className="text-sm font-bold">{fmt(mLoanIn)}</p>
            </div>
          )}
          {mLoanOut > 0 && (
            <div>
              <p className="text-xs text-orange-200">Loan Paid</p>
              <p className="text-sm font-bold">{fmt(mLoanOut)}</p>
            </div>
          )}
        </div>
      </div>

      {overspending && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-600 font-medium">
            You spent {fmt(mOut - mIn)} more than you earned this month.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!form && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => openForm('income')}
            className="flex flex-col items-center justify-center gap-1 bg-[#1B4332] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#2D6A4F] transition-colors"
          >
            <TrendingUp size={15} /> Add Income
          </button>
          <button
            onClick={() => openForm('expense')}
            className="flex flex-col items-center justify-center gap-1 bg-red-500 text-white py-3 rounded-xl font-bold text-xs hover:bg-red-600 transition-colors"
          >
            <TrendingDown size={15} /> Add Expense
          </button>
          <button
            onClick={() => openForm('loan')}
            className="flex flex-col items-center justify-center gap-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors"
          >
            <CreditCard size={15} /> Take Loan
          </button>
        </div>
      )}

      {/* Income / Expense form */}
      {(form === 'income' || form === 'expense') && (
        <div className={`bg-white rounded-2xl border p-5 ${form === 'income' ? 'border-[#D8F3DC]' : 'border-red-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold text-sm ${form === 'income' ? 'text-[#1B4332]' : 'text-red-600'}`}>
              {form === 'income' ? '+ Add Income' : '− Add Expense'}
            </h2>
            <button onClick={() => setForm(null)} className="text-gray-400 text-xl leading-none">×</button>
          </div>
          <form onSubmit={handleAddTx} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount (₨)</label>
              <input
                type="number" min="1" step="any" required
                value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0"
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
                  {form === 'expense' && (
                    <option value={CUSTOM}>✏ Custom…</option>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              {category === CUSTOM && (
                <input
                  type="text"
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  placeholder="Type your category name"
                  autoFocus
                  className="mt-2 w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
                />
              )}
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
              className={`w-full py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 transition-colors ${form === 'income' ? 'bg-[#1B4332] hover:bg-[#2D6A4F]' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {saving ? 'Saving…' : `Save ${form === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </div>
      )}

      {/* Loan form */}
      {form === 'loan' && (
        <div className="bg-white rounded-2xl border border-blue-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-blue-700">Take a Loan</h2>
            <button onClick={() => setForm(null)} className="text-gray-400 text-xl leading-none">×</button>
          </div>
          <form onSubmit={handleAddLoan} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Lender Name</label>
              <input
                type="text" value={lenderName} onChange={e => setLenderName(e.target.value)}
                placeholder="e.g. Ali Bhai, Bank XYZ"
                className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Loan Amount (₨)</label>
              <input
                type="number" min="1" step="any"
                value={loanAmt} onChange={e => setLoanAmt(e.target.value)}
                placeholder="0"
                className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date Taken</label>
                <input
                  type="date" value={loanDate} onChange={e => setLoanDate(e.target.value)}
                  className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Due Date (opt.)</label>
                <input
                  type="date" value={loanDue} onChange={e => setLoanDue(e.target.value)}
                  className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Note (optional)</label>
              <input
                type="text" value={loanNote} onChange={e => setLoanNote(e.target.value)}
                placeholder="e.g. Emergency, business"
                className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50"
              />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox" checked={loanToWallet}
                onChange={e => setLoanToWallet(e.target.checked)}
                className="mt-0.5 rounded accent-blue-600"
              />
              <span className="text-xs text-gray-600">
                I received this money in my wallet — add to balance (tracked separately from income, won&apos;t affect Spending Autopsy salary)
              </span>
            </label>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <button
              type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Record Loan'}
            </button>
          </form>
        </div>
      )}

      {/* Partial Pay form */}
      {form === 'pay_loan' && activeLoan && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm text-orange-700">Partial Payment</h2>
            <button
              onClick={() => { setForm(null); setActiveLoan(null); }}
              className="text-gray-400 text-xl leading-none"
            >×</button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            <strong>{activeLoan.lender_name}</strong> · Remaining:{' '}
            <strong className="text-orange-600">{fmt(activeLoan.remaining_amount)}</strong>
          </p>
          <form onSubmit={handlePayLoan} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                How much are you paying? (₨)
              </label>
              <input
                type="number" min="1" step="any"
                value={payAmt} onChange={e => setPayAmt(e.target.value)}
                placeholder={`Max ${fmt(activeLoan.remaining_amount)}`}
                className="w-full border border-orange-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 font-semibold"
              />
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            <button
              type="submit" disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-60 transition-colors"
            >
              {saving ? 'Saving…' : 'Record Partial Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-800">
                Active Loans ({activeLoans.length})
              </span>
            </div>
            <span className="text-xs font-bold text-blue-700">
              Total remaining: {fmt(totalRemaining)}
            </span>
          </div>
          <div className="divide-y divide-blue-50">
            {activeLoans.map(loan => {
              const progress = loan.loan_amount > 0
                ? Math.round((loan.paid_amount / loan.loan_amount) * 100) : 0;
              const overdue = loan.due_date &&
                new Date(loan.due_date + 'T00:00:00') < new Date();
              return (
                <div key={loan.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-800">{loan.lender_name}</p>
                      {loan.note && (
                        <p className="text-xs text-gray-400 truncate">{loan.note}</p>
                      )}
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <p className="text-sm font-bold text-blue-700">{fmt(loan.remaining_amount)}</p>
                      <p className="text-xs text-gray-400">of {fmt(loan.loan_amount)}</p>
                    </div>
                  </div>
                  <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-blue-400 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span>{progress}% paid</span>
                      {loan.due_date && (
                        <span className={overdue ? 'text-red-500 font-semibold' : ''}>
                          {overdue ? '⚠ Overdue' : `Due ${new Date(loan.due_date + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Partial — enter a custom amount */}
                      <button
                        onClick={() => openForm('pay_loan', loan)}
                        className="text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Partial
                      </button>
                      {/* Pay Full — clears the whole remaining in one tap */}
                      <button
                        onClick={() => handlePayFull(loan)}
                        disabled={saving}
                        className="text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Pay Full
                      </button>
                      <button
                        onClick={() => handleDeleteLoan(loan.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cleared Loans */}
      {clearedLoans.length > 0 && (
        <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
          <div className="px-4 py-3 bg-[#F0FAF4] flex items-center gap-2">
            <CheckCircle size={15} className="text-[#40916C]" />
            <span className="text-sm font-bold text-[#1B4332]">Cleared Loans</span>
          </div>
          <div className="divide-y divide-green-50">
            {clearedLoans.map(loan => (
              <div key={loan.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{loan.lender_name}</p>
                  <p className="text-xs text-gray-400">
                    {fmt(loan.loan_amount)} ·{' '}
                    {new Date(loan.updated_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#40916C] bg-[#D8F3DC] px-2 py-0.5 rounded-full font-medium">
                    Cleared ✓
                  </span>
                  <button
                    onClick={() => handleDeleteLoan(loan.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top spending this month */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8F4ED] p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Top Spending This Month
          </p>
          <div className="space-y-2.5">
            {topCats.map(({ category: cat, amount: amt }) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{cat}</span>
                    <span className="font-bold text-[#1B4332]">{fmt(amt)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F4EFE6] rounded-full">
                    <div
                      className="h-1.5 bg-[#40916C] rounded-full"
                      style={{ width: `${mOut > 0 ? Math.min(100, (amt / mOut) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-[#E8F4ED] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8F4ED] flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">History</p>
          {months.length > 0 && (
            <div className="relative">
              <select
                value={histMonth}
                onChange={e => setHistMonth(e.target.value)}
                className="text-xs border border-[#D8F3DC] rounded-lg px-2 py-1.5 pr-6 bg-[#F4EFE6] appearance-none focus:outline-none focus:ring-1 focus:ring-[#40916C]"
              >
                <option value="">All time</option>
                {months.map(m => (
                  <option key={m} value={m}>{monthLabel(m)}</option>
                ))}
              </select>
              <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex border-b border-[#E8F4ED]">
          {(['all', 'income', 'expense'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
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
          <div className="py-10 text-center text-sm text-gray-400">No transactions</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map(tx => {
              const style    = TX_STYLE[tx.type];
              const isCredit = tx.type === 'income' || tx.type === 'loan_received';
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${style.bg} ${style.text}`}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{tx.category}</p>
                      {style.tag && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${style.bg} ${style.text}`}>
                          {style.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {tx.note ? `${tx.note} · ` : ''}
                      {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${style.text}`}>
                    {isCredit ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                  <button
                    onClick={() => handleDeleteTx(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
