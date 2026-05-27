'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  getTransactions, addTransaction, deleteTransaction, calcWallet, thisMonthTxs,
  spendByCategory, dailyAverage, fmt, Transaction,
} from '@/lib/transactions';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, RefreshCw, ExternalLink, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';

interface OldCategory {
  id: number;
  name: string;
  amount: number;
  type: 'Needs' | 'Wants';
}

const COLORS = [
  '#1B4332','#2D6A4F','#40916C','#52B788','#74C69D',
  '#d97706','#f59e0b','#ef4444','#e879f9','#60a5fa',
];

const NEEDS_CATS = ['Food & Dining', 'Bills & Utilities', 'Health', 'Education', 'Housing', 'Transport'];

type Tab = 'all' | 'income' | 'expense';

function buildWeekly(txs: Transaction[]) {
  const weeks = [
    { week: 'Wk 1', needs: 0, wants: 0 },
    { week: 'Wk 2', needs: 0, wants: 0 },
    { week: 'Wk 3', needs: 0, wants: 0 },
    { week: 'Wk 4', needs: 0, wants: 0 },
  ];
  txs.filter(t => t.type === 'expense').forEach(t => {
    const day = new Date(t.date + 'T00:00:00').getDate();
    const idx = Math.min(Math.floor((day - 1) / 7), 3);
    if (NEEDS_CATS.includes(t.category)) weeks[idx].needs += t.amount;
    else weeks[idx].wants += t.amount;
  });
  return weeks;
}

export default function SpendingAutopsyPage() {
  const { uid, dataVersion } = useAuth();
  const [txs, setTxs]             = useState<Transaction[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<Tab>('expense');
  const [oldCats, setOldCats]     = useState<OldCategory[]>([]);
  const [migrating, setMigrating] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try { setTxs(await getTransactions(uid)); } catch {}
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load, dataVersion]);

  // Detect old localStorage spending entries
  useEffect(() => {
    try {
      const raw = localStorage.getItem('paisaos_spending');
      if (raw) setOldCats(JSON.parse(raw));
    } catch {}
  }, []);

  const importOldSpending = async () => {
    if (!uid || !oldCats.length) return;
    setMigrating(true);
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const added: Transaction[] = [];
      for (const cat of oldCats) {
        const tx = await addTransaction(uid, {
          type: 'expense',
          amount: cat.amount,
          category: cat.name,
          note: cat.type,
          date: todayStr,
        });
        added.push(tx);
      }
      setTxs(prev => [...added, ...prev]);
      localStorage.removeItem('paisaos_spending');
      setOldCats([]);
    } catch {}
    finally { setMigrating(false); }
  };

  const handleDelete = async (id: string) => {
    setTxs(prev => prev.filter(t => t.id !== id));
    await deleteTransaction(id).catch(() => load());
  };

  // This-month analytics
  const month        = thisMonthTxs(txs);
  const { totalIn: mIn, totalOut: mOut } = calcWallet(month);
  const saved        = mIn - mOut;
  const savingsRate  = mIn > 0 ? Math.round((saved / mIn) * 100) : 0;
  const dayAvg       = dailyAverage(month);
  const topCats      = spendByCategory(month);
  const topCat       = topCats[0];
  const topCatPct    = mOut > 0 && topCat ? Math.round((topCat.amount / mOut) * 100) : 0;
  const overspending = mOut > mIn && mIn > 0;
  const heavyCat     = topCatPct >= 50 && !!topCat;

  const pieData = topCats.map((c, i) => ({ name: c.category, value: c.amount, color: COLORS[i % COLORS.length] }));
  const weekly  = buildWeekly(month);

  const visible = txs.filter(t => tab === 'all' ? true : t.type === tab);
  const empty   = !loading && txs.length === 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Spending Autopsy</h1>
          <p className="text-sm text-[#40916C] mt-1">
            {new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })} · live from wallet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-xl hover:bg-[#D8F3DC] text-[#40916C] transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link
            href="/wallet"
            className="flex items-center gap-1.5 bg-[#1B4332] text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-[#2D6A4F] transition-colors"
          >
            <ExternalLink size={13} /> Add Transaction
          </Link>
        </div>
      </div>

      {/* Migration banner for old localStorage spending entries */}
      {oldCats.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Upload size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              You have {oldCats.length} previous spending {oldCats.length === 1 ? 'entry' : 'entries'} to import
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {oldCats.map(c => c.name).join(', ')}
            </p>
          </div>
          <button
            onClick={importOldSpending}
            disabled={migrating}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {migrating ? 'Importing…' : 'Import as Expenses'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <div className="bg-white rounded-2xl p-12 shadow-card text-center">
          <p className="text-gray-400 text-sm mb-5">No transactions yet. Start by adding income or expenses in your wallet.</p>
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
          >
            Go to Wallet
          </Link>
        </div>
      )}

      {!empty && (
        <>
          {/* This month summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-xs text-gray-400 font-medium">Income</p>
              <p className="text-xl font-bold text-[#1B4332] mt-1">{fmt(mIn)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-xs text-gray-400 font-medium">Total Spent</p>
              <p className="text-xl font-bold text-red-500 mt-1">{fmt(mOut)}</p>
            </div>
            <div className={`rounded-2xl p-4 shadow-card ${saved >= 0 ? 'bg-[#D8F3DC]' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-400 font-medium">Saved</p>
              <p className={`text-base font-bold mt-1 leading-tight ${saved >= 0 ? 'text-[#1B4332]' : 'text-red-500'}`}>
                {fmt(saved)}
                <span className="text-sm font-medium ml-1">({savingsRate}%)</span>
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-xs text-gray-400 font-medium">Daily Avg</p>
              <p className="text-xl font-bold text-[#1B4332] mt-1">{fmt(dayAvg)}</p>
            </div>
          </div>

          {/* Alerts */}
          {(overspending || heavyCat) && (
            <div className="space-y-2">
              {overspending && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  You spent {fmt(mOut - mIn)} more than you earned this month.
                </div>
              )}
              {heavyCat && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>
                    <strong>{topCat.category}</strong> is {topCatPct}% of all spending — consider spreading costs.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Spending by category pie */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h3 className="font-bold text-[#1B4332] mb-4">Spending by Category</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={v => <span className="text-xs text-gray-600">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-sm text-gray-400">No expenses this month</p>
              )}
            </div>

            {/* Weekly spending pattern bar chart */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h3 className="font-bold text-[#1B4332] mb-1">Weekly Spending Pattern</h3>
              <p className="text-xs text-gray-400 mb-4">Needs vs Wants this month</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weekly} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v: number, name: string) => [fmt(v), name === 'needs' ? 'Needs' : 'Wants']} />
                  <Bar dataKey="needs" fill="#1B4332" radius={[4, 4, 0, 0]} name="needs" />
                  <Bar dataKey="wants" fill="#74C69D" radius={[4, 4, 0, 0]} name="wants" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category breakdown bars */}
          {topCats.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h3 className="font-bold text-[#1B4332] mb-4">Category Breakdown — This Month</h3>
              <div className="space-y-3">
                {topCats.map((c, i) => {
                  const pct = mOut > 0 ? Math.round((c.amount / mOut) * 100) : 0;
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700 truncate">{c.category}</span>
                          <span className="font-bold text-[#1B4332] ml-2 flex-shrink-0">{fmt(c.amount)}</span>
                        </div>
                        <div className="h-1.5 bg-[#F4EFE6] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right flex-shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction history */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#1B4332]">Transaction History</h3>
              <span className="text-xs text-gray-400">{txs.length} records</span>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-gray-100">
              {(['all', 'income', 'expense'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                    tab === t
                      ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No transactions</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {visible.map(tx => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 group hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        tx.type === 'income' ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-red-50 text-red-500'
                      }`}
                    >
                      {tx.type === 'income' ? '↑' : '↓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{tx.category}</p>
                      <p className="text-xs text-gray-400">
                        {tx.note ? `${tx.note} · ` : ''}
                        {new Date(tx.date + 'T00:00:00').toLocaleDateString('en-PK', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
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
        </>
      )}
    </div>
  );
}
