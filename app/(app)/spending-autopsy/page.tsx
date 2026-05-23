'use client';

import { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

const categories = [
  { name: 'Rent', amount: 25000, budget: 25000, type: 'Needs', color: '#1B4332', intentional: true },
  { name: 'Groceries', amount: 12000, budget: 15000, type: 'Needs', color: '#2D6A4F', intentional: true },
  { name: 'Utilities', amount: 8200, budget: 8000, type: 'Needs', color: '#40916C', intentional: true },
  { name: 'Transport', amount: 6000, budget: 6000, type: 'Needs', color: '#52B788', intentional: true },
  { name: 'Medical', amount: 3000, budget: 5000, type: 'Needs', color: '#74C69D', intentional: true },
  { name: 'Dining Out', amount: 8000, budget: 5000, type: 'Wants', color: '#d97706', intentional: false },
  { name: 'Shopping', amount: 7400, budget: 5000, type: 'Wants', color: '#f59e0b', intentional: false },
  { name: 'Entertainment', amount: 5000, budget: 4000, type: 'Wants', color: '#fbbf24', intentional: true },
  { name: 'Subscriptions', amount: 3200, budget: 3000, type: 'Wants', color: '#fcd34d', intentional: true },
  { name: 'Misc / Impulse', amount: 2800, budget: 1000, type: 'Wants', color: '#ef4444', intentional: false },
];

const weeklyData = [
  { week: 'Wk 1', needs: 14000, wants: 8000 },
  { week: 'Wk 2', needs: 12500, wants: 9200 },
  { week: 'Wk 3', needs: 11800, wants: 7400 },
  { week: 'Wk 4', needs: 15900, wants: 1800 },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');

export default function SpendingAutopsyPage() {
  const [selectedType, setSelectedType] = useState<'All' | 'Needs' | 'Wants'>('All');

  const filtered = selectedType === 'All' ? categories : categories.filter((c) => c.type === selectedType);
  const total = filtered.reduce((s, c) => s + c.amount, 0);
  const overBudget = filtered.filter((c) => c.amount > c.budget);
  const autopilot = categories.filter((c) => !c.intentional).reduce((s, c) => s + c.amount, 0);
  const intentionalTotal = categories.reduce((s, c) => s + c.amount, 0);
  const imr = Math.round(((intentionalTotal - autopilot) / intentionalTotal) * 100);

  const pieData = filtered.map((c) => ({ name: c.name, value: c.amount, color: c.color }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Spending Autopsy</h1>
        <p className="text-sm text-[#40916C] mt-1">Understand your spending without judgement</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Total Spent</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{fmt(categories.reduce((s, c) => s + c.amount, 0))}</p>
          <p className="text-xs text-gray-400">May 2025</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Intentional Money Rate</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{imr}%</p>
          <p className="text-xs text-[#40916C]">Good range</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Autopilot Spending</p>
          <p className="text-xl font-bold text-red-600 mt-1">{fmt(autopilot)}</p>
          <p className="text-xs text-gray-400">Unintentional</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Over Budget</p>
          <p className="text-xl font-bold text-orange-600 mt-1">{overBudget.length} categories</p>
          <p className="text-xs text-gray-400">Need attention</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Spending by Category</h3>
            <div className="flex gap-1">
              {(['All', 'Needs', 'Wants'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedType === t ? 'bg-[#1B4332] text-white' : 'bg-[#F4EFE6] text-[#2D6A4F] hover:bg-[#D8F3DC]'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-3">Total: <span className="font-bold text-[#1B4332]">{fmt(total)}</span></p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly pattern */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">Weekly Spending Pattern</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number, name: string) => [fmt(v), name.charAt(0).toUpperCase() + name.slice(1)]} />
              <Bar dataKey="needs" fill="#1B4332" radius={[4, 4, 0, 0]} name="Needs" />
              <Bar dataKey="wants" fill="#74C69D" radius={[4, 4, 0, 0]} name="Wants" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Over budget alerts */}
      {overBudget.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-orange-500" />
            <h3 className="font-bold text-orange-700">Budget Overruns This Month</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overBudget.map((c) => (
              <div key={c.name} className="bg-white rounded-xl p-3 border border-orange-100">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-[#1C1C1C] text-sm">{c.name}</p>
                  <span className="text-xs text-red-500 font-bold">+{fmt(c.amount - c.budget)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Spent {fmt(c.amount)} vs budget {fmt(c.budget)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#1B4332]">All Categories</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {categories.map((c) => {
            const over = c.amount > c.budget;
            const pct = Math.min(Math.round((c.amount / c.budget) * 100), 150);
            return (
              <div key={c.name} className="px-5 py-4 hover:bg-[#F4EFE6]/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1C1C1C]">{c.name}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{c.type}</span>
                      {!c.intentional && (
                        <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingDown size={10} /> Autopilot
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-[#F4EFE6] rounded-full overflow-hidden w-full max-w-xs">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: over ? '#ef4444' : c.color }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${over ? 'text-red-500' : 'text-[#1B4332]'}`}>
                      {fmt(c.amount)}
                    </p>
                    <p className="text-xs text-gray-400">of {fmt(c.budget)}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {over ? (
                      <TrendingUp size={16} className="text-red-400" />
                    ) : (
                      <TrendingDown size={16} className="text-[#40916C]" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
