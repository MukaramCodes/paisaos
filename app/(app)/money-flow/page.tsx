'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Info } from 'lucide-react';

const DEFAULT_INCOME = 120000;

const flowCategories = [
  {
    label: 'Needs',
    description: 'Essentials you must pay',
    target: 50,
    items: [
      { name: 'Rent', amount: 25000 },
      { name: 'Groceries', amount: 12000 },
      { name: 'Utilities', amount: 8200 },
      { name: 'Transport', amount: 6000 },
      { name: 'Medical', amount: 3000 },
    ],
    color: '#1B4332',
    lightColor: '#D8F3DC',
  },
  {
    label: 'Wants',
    description: 'Lifestyle & enjoyment',
    target: 30,
    items: [
      { name: 'Dining Out', amount: 8000 },
      { name: 'Entertainment', amount: 5000 },
      { name: 'Shopping', amount: 7400 },
      { name: 'Subscriptions', amount: 3200 },
      { name: 'Misc', amount: 2800 },
    ],
    color: '#40916C',
    lightColor: '#D8F3DC',
  },
  {
    label: 'Savings & Investments',
    description: 'Building your future',
    target: 20,
    items: [
      { name: 'Emergency Fund', amount: 15000 },
      { name: 'Car Fund', amount: 10000 },
      { name: 'Stocks / Mutual Funds', amount: 5000 },
      { name: 'Laptop Fund', amount: 3600 },
    ],
    color: '#74C69D',
    lightColor: '#D8F3DC',
  },
];

const monthlyData = [
  { month: 'Nov', needs: 58000, wants: 28000, savings: 22000 },
  { month: 'Dec', needs: 72000, wants: 38000, savings: 15000 },
  { month: 'Jan', needs: 55000, wants: 31000, savings: 28000 },
  { month: 'Feb', needs: 57000, wants: 29000, savings: 30000 },
  { month: 'Mar', needs: 56000, wants: 33000, savings: 27000 },
  { month: 'Apr', needs: 61000, wants: 30000, savings: 24000 },
  { month: 'May', needs: 54200, wants: 26400, savings: 33600 },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');
const pct = (n: number, income: number) => income > 0 ? Math.round((n / income) * 100) : 0;

export default function MoneyFlowPage() {
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [inputVal, setInputVal] = useState(DEFAULT_INCOME.toString());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('paisaos_income');
    if (saved) {
      const n = Number(saved);
      setIncome(n);
      setInputVal(n.toString());
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('paisaos_income', income.toString());
  }, [income, mounted]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const stripped = raw.replace(/^0+(\d)/, '$1');
    setInputVal(stripped);
    setIncome(stripped ? parseInt(stripped, 10) : 0);
  };

  const totalSpent = flowCategories
    .flatMap((c) => c.items)
    .reduce((s, i) => s + i.amount, 0);
  const unallocated = income - totalSpent;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Money Flow</h1>
        <p className="text-sm text-[#40916C] mt-1">See exactly where every rupee goes this month</p>
      </div>

      {/* Income Input */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-[#1B4332] mb-1">Monthly Net Income</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#40916C] font-bold text-sm">Rs</span>
              <input
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={handleIncomeChange}
                placeholder="Enter your income"
                className="w-full pl-10 pr-4 py-3 border border-[#D8F3DC] rounded-xl text-lg font-bold text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
              />
            </div>
          </div>
          <div className="flex gap-4 sm:gap-6 text-center">
            <div className="bg-[#F4EFE6] rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 font-medium">Spent</p>
              <p className="text-lg font-bold text-[#1B4332]">{fmt(totalSpent)}</p>
              <p className="text-xs text-gray-400">{pct(totalSpent, income)}% of income</p>
            </div>
            <div className={`rounded-xl px-4 py-3 ${unallocated >= 0 ? 'bg-[#D8F3DC]' : 'bg-red-50'}`}>
              <p className="text-xs text-gray-500 font-medium">Unallocated</p>
              <p className={`text-lg font-bold ${unallocated >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                {fmt(Math.abs(unallocated))}
              </p>
              <p className="text-xs text-gray-400">{unallocated >= 0 ? 'left over' : 'over budget'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {flowCategories.map((cat) => {
          const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
          const catPct = pct(catTotal, income);
          const targetDiff = catPct - cat.target;
          return (
            <div key={cat.label} className="bg-white rounded-2xl p-6 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#1B4332] text-lg">{cat.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  {catPct}%
                </div>
              </div>

              <div className="mb-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{fmt(catTotal)}</span>
                  <span className={targetDiff > 0 ? 'text-red-500' : 'text-[#2D6A4F]'}>
                    Target: {cat.target}% {targetDiff !== 0 && `(${targetDiff > 0 ? '+' : ''}${targetDiff}%)`}
                  </span>
                </div>
                <div className="h-2.5 bg-[#F4EFE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(catPct, 100)}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-[#1C1C1C] tabular-nums">{fmt(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 50/30/20 Rule */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-bold text-[#1B4332]">50/30/20 Rule Check</h3>
          <Info size={14} className="text-gray-400" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {flowCategories.map((cat) => {
            const catTotal = cat.items.reduce((s, i) => s + i.amount, 0);
            const actual = pct(catTotal, income);
            const ok = cat.label === 'Savings & Investments' ? actual >= cat.target : actual <= cat.target;
            return (
              <div
                key={cat.label}
                className={`rounded-xl p-4 border-2 ${ok ? 'border-[#74C69D] bg-[#F4EFE6]' : 'border-orange-200 bg-orange-50'}`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-[#1B4332]">{cat.label}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-[#D8F3DC] text-[#1B4332]' : 'bg-orange-100 text-orange-700'}`}>
                    {ok ? '✓ On track' : '⚠ Review'}
                  </span>
                </div>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-3xl font-extrabold" style={{ color: cat.color }}>{actual}%</span>
                  <span className="text-gray-400 text-sm mb-1">/ target {cat.target}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-[#1B4332] mb-4">6-Month Spending Trend</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number, name: string) => [fmt(v), name.charAt(0).toUpperCase() + name.slice(1)]} />
            <Bar dataKey="needs" stackId="a" fill="#1B4332" radius={[0, 0, 4, 4]} name="Needs" />
            <Bar dataKey="wants" stackId="a" fill="#40916C" name="Wants" />
            <Bar dataKey="savings" stackId="a" fill="#74C69D" radius={[4, 4, 0, 0]} name="Savings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
