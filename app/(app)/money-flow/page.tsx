'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Info, RefreshCw } from 'lucide-react';
import { getTransactions, thisMonthTxs, spendByCategory, fmt, Transaction } from '@/lib/transactions';

// Default category → Needs/Wants classification
const DEFAULT_CLASSIFY: Record<string, 'Needs' | 'Wants'> = {
  'Food & Dining':    'Needs',
  'Transport':        'Needs',
  'Bills & Utilities':'Needs',
  'Health':           'Needs',
  'Housing':          'Needs',
  'Education':        'Needs',
  'Shopping':         'Wants',
  'Entertainment':    'Wants',
  'Clothing':         'Wants',
  'Other':            'Wants',
};

const pct = (n: number, total: number) => total > 0 ? Math.round((n / total) * 100) : 0;

const CLASSIFY_KEY = 'paisaos_flow_classify';

export default function MoneyFlowPage() {
  const { uid, dataVersion } = useAuth();
  const [txs, setTxs]         = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [classify, setClassify] = useState<Record<string, 'Needs' | 'Wants'>>({});

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getTransactions(uid);
      setTxs(data);
    } catch {}
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => { load(); }, [load, dataVersion]);

  // Load saved classification overrides
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CLASSIFY_KEY) || '{}');
      setClassify(saved);
    } catch {}
  }, []);

  const toggleClassify = (category: string) => {
    const current = classify[category] ?? DEFAULT_CLASSIFY[category] ?? 'Wants';
    const next: 'Needs' | 'Wants' = current === 'Needs' ? 'Wants' : 'Needs';
    const updated = { ...classify, [category]: next };
    setClassify(updated);
    localStorage.setItem(CLASSIFY_KEY, JSON.stringify(updated));
  };

  const getClass = (category: string): 'Needs' | 'Wants' =>
    classify[category] ?? DEFAULT_CLASSIFY[category] ?? 'Wants';

  // ── Derived values ────────────────────────────────────────────────────────
  const month    = thisMonthTxs(txs);
  const income   = month.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const catSpend = spendByCategory(month); // [{category, amount}] sorted by amount

  const needsItems = catSpend.filter(c => getClass(c.category) === 'Needs');
  const wantsItems = catSpend.filter(c => getClass(c.category) === 'Wants');
  const needsTotal = needsItems.reduce((s, c) => s + c.amount, 0);
  const wantsTotal = wantsItems.reduce((s, c) => s + c.amount, 0);
  const totalSpent = needsTotal + wantsTotal;
  const savings    = Math.max(0, income - totalSpent);

  const needsPct   = pct(needsTotal, income);
  const wantsPct   = pct(wantsTotal, income);
  const savingsPct = income > 0 ? Math.max(0, 100 - needsPct - wantsPct) : 0;

  const chartData = [
    { name: 'Needs',   amount: needsTotal,  color: '#1B4332' },
    { name: 'Wants',   amount: wantsTotal,  color: '#40916C' },
    { name: 'Savings', amount: savings,      color: '#74C69D' },
  ];

  const ruleChecks = [
    { label: 'Needs',   target: 50, actual: needsPct,   better: 'under', color: '#1B4332' },
    { label: 'Wants',   target: 30, actual: wantsPct,   better: 'under', color: '#40916C' },
    { label: 'Savings', target: 20, actual: savingsPct, better: 'over',  color: '#74C69D' },
  ];

  const monthLabel = new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Money Flow</h1>
          <p className="text-sm text-[#40916C] mt-0.5">{monthLabel} · live from wallet</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-[#D8F3DC] text-[#40916C] transition-colors">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Income banner */}
      <div className="bg-[#1B4332] rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold text-[#74C69D] uppercase tracking-wide mb-1">Monthly Income (from wallet)</p>
        <p className="text-4xl font-extrabold tracking-tight">{fmt(income)}</p>
        {income === 0 && (
          <p className="text-xs text-[#74C69D]/70 mt-2">
            No income recorded this month — add income in the Wallet to see your flow.
          </p>
        )}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-sm">
          <div>
            <p className="text-xs text-[#74C69D]">Needs</p>
            <p className="font-bold">{fmt(needsTotal)}</p>
            <p className="text-xs text-white/50">{needsPct}%</p>
          </div>
          <div>
            <p className="text-xs text-[#74C69D]">Wants</p>
            <p className="font-bold">{fmt(wantsTotal)}</p>
            <p className="text-xs text-white/50">{wantsPct}%</p>
          </div>
          <div>
            <p className="text-xs text-[#74C69D]">Savings</p>
            <p className="font-bold">{fmt(savings)}</p>
            <p className="text-xs text-white/50">{savingsPct}%</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading wallet data…</div>
      ) : txs.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          <p>No transactions yet.</p>
          <a href="/wallet" className="text-[#40916C] font-medium hover:underline mt-1 inline-block">
            Add income & expenses in Wallet →
          </a>
        </div>
      ) : (
        <>
          {/* Needs vs Wants columns */}
          <div className="grid lg:grid-cols-2 gap-4">

            {/* NEEDS */}
            <div className="bg-white rounded-2xl border border-[#E8F4ED] overflow-hidden">
              <div className="px-5 py-4 bg-[#1B4332] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base">Needs</p>
                    <p className="text-xs text-[#74C69D] mt-0.5">Essentials you must pay</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold">{needsPct}%</p>
                    <p className="text-xs text-[#74C69D]">target ≤ 50%</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${needsPct > 50 ? 'bg-red-400' : 'bg-[#74C69D]'}`}
                    style={{ width: `${Math.min(needsPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="divide-y divide-[#F4EFE6]">
                {needsItems.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-gray-400">
                    No Needs spending this month.
                  </p>
                ) : needsItems.map(({ category, amount }) => (
                  <div key={category} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{category}</p>
                      <div className="h-1 bg-[#F4EFE6] rounded-full mt-1">
                        <div
                          className="h-1 bg-[#1B4332] rounded-full"
                          style={{ width: `${pct(amount, needsTotal)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#1B4332] flex-shrink-0">{fmt(amount)}</p>
                    <button
                      onClick={() => toggleClassify(category)}
                      className="text-[10px] font-semibold text-gray-400 hover:text-orange-500 bg-gray-100 hover:bg-orange-50 px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                      title="Move to Wants"
                    >
                      → Wants
                    </button>
                  </div>
                ))}
                <div className="px-5 py-3 bg-[#F4EFE6]">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-[#1B4332]">Total Needs</span>
                    <span className="font-bold text-[#1B4332]">{fmt(needsTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WANTS */}
            <div className="bg-white rounded-2xl border border-[#E8F4ED] overflow-hidden">
              <div className="px-5 py-4 bg-[#40916C] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-base">Wants</p>
                    <p className="text-xs text-[#D8F3DC] mt-0.5">Lifestyle & enjoyment</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold">{wantsPct}%</p>
                    <p className="text-xs text-[#D8F3DC]">target ≤ 30%</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${wantsPct > 30 ? 'bg-red-400' : 'bg-[#D8F3DC]'}`}
                    style={{ width: `${Math.min(wantsPct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="divide-y divide-[#F4EFE6]">
                {wantsItems.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-gray-400">
                    No Wants spending this month.
                  </p>
                ) : wantsItems.map(({ category, amount }) => (
                  <div key={category} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{category}</p>
                      <div className="h-1 bg-[#F4EFE6] rounded-full mt-1">
                        <div
                          className="h-1 bg-[#40916C] rounded-full"
                          style={{ width: `${pct(amount, wantsTotal)}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#40916C] flex-shrink-0">{fmt(amount)}</p>
                    <button
                      onClick={() => toggleClassify(category)}
                      className="text-[10px] font-semibold text-gray-400 hover:text-[#1B4332] bg-gray-100 hover:bg-[#D8F3DC] px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
                      title="Move to Needs"
                    >
                      → Needs
                    </button>
                  </div>
                ))}
                <div className="px-5 py-3 bg-[#F4EFE6]">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-[#40916C]">Total Wants</span>
                    <span className="font-bold text-[#40916C]">{fmt(wantsTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings row */}
          <div className={`rounded-2xl p-5 ${savings > 0 ? 'bg-[#D8F3DC] border border-[#74C69D]' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${savings > 0 ? 'text-[#1B4332]' : 'text-red-700'}`}>
                  {savings > 0 ? '✓ Savings / Remaining' : '⚠ Over Budget'}
                </p>
                <p className={`text-xs mt-0.5 ${savings > 0 ? 'text-[#40916C]' : 'text-red-500'}`}>
                  {savings > 0
                    ? `${savingsPct}% of income · target ≥ 20%`
                    : `You spent ${fmt(totalSpent - income)} more than you earned`}
                </p>
              </div>
              <p className={`text-3xl font-extrabold ${savings > 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                {fmt(savings)}
              </p>
            </div>
          </div>

          {/* 50/30/20 Rule Check */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-[#1B4332]">50/30/20 Rule Check</h3>
              <Info size={14} className="text-gray-400" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {ruleChecks.map(({ label, target, actual, better, color }) => {
                const ok = better === 'under' ? actual <= target : actual >= target;
                return (
                  <div
                    key={label}
                    className={`rounded-xl p-4 border-2 ${ok ? 'border-[#74C69D] bg-[#F4EFE6]' : 'border-orange-200 bg-orange-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-[#1B4332]">{label}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-orange-100 text-orange-700'}`}>
                        {ok ? '✓ On track' : '⚠ Review'}
                      </span>
                    </div>
                    <div className="flex items-end gap-1 mt-2">
                      <span className="text-3xl font-extrabold" style={{ color }}>{actual}%</span>
                      <span className="text-gray-400 text-sm mb-1">/ target {better === 'under' ? '≤' : '≥'}{target}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <h3 className="font-bold text-[#1B4332] mb-4">This Month&apos;s Breakdown</h3>
            {totalSpent > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={52}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Amount']} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-[#F4EFE6] rounded-xl">
                <p className="text-sm text-gray-400">Add expenses in Wallet to see your breakdown</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
