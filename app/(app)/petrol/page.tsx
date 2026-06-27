'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Fuel, Plus, Trash2, AlertTriangle, TrendingUp, Target, Droplets } from 'lucide-react';

interface Fill {
  id: number;
  date: string;
  amount: number;
  liters: number;
  ppl: number;
  note: string;
}

interface SpendingCategory {
  id: number;
  name: string;
  amount: number;
  budget: number;
  type: 'Needs' | 'Wants';
  color: string;
  intentional: boolean;
}

const LS_FILLS = 'paisaos_petrol_fills';
const LS_BUDGET = 'paisaos_petrol_budget';
const LS_SPENDING = 'paisaos_spending';
const PETROL_COLOR = '#f97316';

const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
}

export default function PetrolPage() {
  const [fills, setFills] = useState<Fill[]>([]);
  const [budget, setBudget] = useState(0);
  const [budgetInput, setBudgetInput] = useState('');
  const [editingBudget, setEditingBudget] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [newFill, setNewFill] = useState({
    date: todayStr(),
    amount: '',
    liters: '',
    ppl: '',
    note: '',
  });

  const currentMonth = monthKey(new Date());

  const syncToSpendingAutopsy = useCallback((updatedFills: Fill[]) => {
    const thisMonthFills = updatedFills.filter((f) => f.date.startsWith(currentMonth));
    const totalThisMonth = thisMonthFills.reduce((s, f) => s + f.amount, 0);

    const raw = localStorage.getItem(LS_SPENDING);
    const categories: SpendingCategory[] = raw ? JSON.parse(raw) : [];

    const petrolIdx = categories.findIndex(
      (c) => c.name.toLowerCase() === 'petrol' || c.name.toLowerCase() === 'fuel'
    );

    if (totalThisMonth > 0) {
      if (petrolIdx >= 0) {
        categories[petrolIdx] = {
          ...categories[petrolIdx],
          amount: totalThisMonth,
          budget: budget || totalThisMonth,
        };
      } else {
        categories.push({
          id: Date.now(),
          name: 'Petrol',
          amount: totalThisMonth,
          budget: budget || totalThisMonth,
          type: 'Needs',
          color: PETROL_COLOR,
          intentional: true,
        });
      }
    } else if (petrolIdx >= 0) {
      categories[petrolIdx] = { ...categories[petrolIdx], amount: 0 };
    }

    localStorage.setItem(LS_SPENDING, JSON.stringify(categories));
  }, [currentMonth, budget]);

  useEffect(() => {
    const savedFills = localStorage.getItem(LS_FILLS);
    if (savedFills) setFills(JSON.parse(savedFills));
    const savedBudget = localStorage.getItem(LS_BUDGET);
    if (savedBudget) {
      const n = Number(savedBudget);
      setBudget(n);
      setBudgetInput(n.toString());
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(LS_FILLS, JSON.stringify(fills));
    syncToSpendingAutopsy(fills);
  }, [fills, mounted, syncToSpendingAutopsy]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(LS_BUDGET, budget.toString());
  }, [budget, mounted]);

  const saveBudget = () => {
    const n = Number(budgetInput.replace(/[^0-9]/g, ''));
    setBudget(n);
    setEditingBudget(false);
  };

  const handlePplChange = (val: string) => {
    const ppl = val.replace(/[^0-9.]/g, '');
    const liters = newFill.liters ? (Number(newFill.liters) * Number(ppl || 0)).toFixed(0) : '';
    setNewFill((p) => ({ ...p, ppl, amount: liters }));
  };

  const handleLitersChange = (val: string) => {
    const liters = val.replace(/[^0-9.]/g, '');
    const amount = newFill.ppl ? (Number(liters) * Number(newFill.ppl)).toFixed(0) : '';
    setNewFill((p) => ({ ...p, liters, amount }));
  };

  const addFill = () => {
    if (!newFill.amount) return;
    setFills((prev) => [
      {
        id: Date.now(),
        date: newFill.date,
        amount: Number(newFill.amount),
        liters: Number(newFill.liters) || 0,
        ppl: Number(newFill.ppl) || 0,
        note: newFill.note.trim(),
      },
      ...prev,
    ]);
    setNewFill({ date: todayStr(), amount: '', liters: '', ppl: '', note: '' });
    setShowAdd(false);
  };

  const deleteFill = (id: number) => {
    setFills((prev) => prev.filter((f) => f.id !== id));
  };

  const thisMonthFills = fills.filter((f) => f.date.startsWith(currentMonth));
  const thisMonthTotal = thisMonthFills.reduce((s, f) => s + f.amount, 0);
  const thisMonthLiters = thisMonthFills.reduce((s, f) => s + f.liters, 0);
  const budgetUsedPct = budget > 0 ? Math.min(Math.round((thisMonthTotal / budget) * 100), 100) : 0;
  const overBudget = budget > 0 && thisMonthTotal > budget;
  const remaining = budget > 0 ? budget - thisMonthTotal : 0;
  const avgPpl = thisMonthFills.filter((f) => f.ppl > 0).length > 0
    ? thisMonthFills.filter((f) => f.ppl > 0).reduce((s, f) => s + f.ppl, 0) /
      thisMonthFills.filter((f) => f.ppl > 0).length
    : 0;
  const fillCount = thisMonthFills.length;

  // Build last 6 months chart data
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const key = monthKey(d);
    const total = fills.filter((f) => f.date.startsWith(key)).reduce((s, f) => s + f.amount, 0);
    return { month: monthLabel(key).split(' ')[0], total };
  });

  const recentFills = [...fills].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332] flex items-center gap-2">
            <Fuel size={24} className="text-orange-500" /> Petrol Tracker
          </h1>
          <p className="text-sm text-[#40916C] mt-1">Track every fill-up and stay within your fuel budget</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Fill-up
        </button>
      </div>

      {/* Add Fill-up Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#1B4332] text-lg mb-4">Add Fill-up</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={newFill.date}
                  onChange={(e) => setNewFill((p) => ({ ...p, date: e.target.value }))}
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Liters</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newFill.liters}
                    onChange={(e) => handleLitersChange(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Price/Liter (₨)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newFill.ppl}
                    onChange={(e) => handlePplChange(e.target.value)}
                    placeholder="e.g. 290"
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Total Amount (₨)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newFill.amount}
                  onChange={(e) => setNewFill((p) => ({ ...p, amount: e.target.value.replace(/[^0-9]/g, '') }))}
                  placeholder="e.g. 4350"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C] font-semibold"
                />
                <p className="text-xs text-gray-400 mt-1">Auto-calculated from liters × price, or enter manually</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Note (optional)</label>
                <input
                  value={newFill.note}
                  onChange={(e) => setNewFill((p) => ({ ...p, note: e.target.value }))}
                  placeholder="e.g. PSO near office"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-[#D8F3DC] rounded-xl text-sm font-medium text-gray-500 hover:bg-[#F4EFE6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addFill}
                disabled={!newFill.amount}
                className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors disabled:opacity-50"
              >
                Add Fill-up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Bar */}
      <div className={`rounded-2xl p-6 ${overBudget ? 'bg-red-50 border border-red-100' : 'bg-white shadow-card'}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Monthly Fuel Budget</p>
            {editingBudget ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 font-medium">₨</span>
                <input
                  autoFocus
                  type="text"
                  inputMode="numeric"
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveBudget(); if (e.key === 'Escape') setEditingBudget(false); }}
                  className="w-36 border border-[#D8F3DC] rounded-xl px-3 py-1.5 text-xl font-bold text-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
                <button onClick={saveBudget} className="px-3 py-1.5 bg-[#1B4332] text-white rounded-lg text-sm font-medium hover:bg-[#2D6A4F]">Save</button>
                <button onClick={() => setEditingBudget(false)} className="text-gray-400 text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => { setBudgetInput(budget.toString()); setEditingBudget(true); }} className="text-left group">
                <p className="text-2xl font-extrabold text-[#1B4332] group-hover:text-[#2D6A4F]">
                  {budget > 0 ? fmt(budget) : <span className="text-gray-300 text-lg">Set budget</span>}
                </p>
              </button>
            )}
          </div>
          {budget > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Spent this month</p>
              <p className={`text-2xl font-extrabold ${overBudget ? 'text-red-600' : 'text-[#1B4332]'}`}>{fmt(thisMonthTotal)}</p>
            </div>
          )}
        </div>

        {budget > 0 && (
          <>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${budgetUsedPct}%`,
                  backgroundColor: overBudget ? '#ef4444' : budgetUsedPct > 80 ? '#f97316' : '#1B4332',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{budgetUsedPct}% used</span>
              {overBudget ? (
                <span className="text-red-500 font-semibold flex items-center gap-1">
                  <AlertTriangle size={11} /> {fmt(thisMonthTotal - budget)} over budget
                </span>
              ) : (
                <span className="text-[#40916C] font-medium">{fmt(remaining)} remaining</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Fuel size={14} className="text-orange-500" />
            <p className="text-xs text-gray-500 font-medium">This Month</p>
          </div>
          <p className="text-xl font-bold text-[#1B4332]">{fmt(thisMonthTotal)}</p>
          <p className="text-xs text-gray-400">{fillCount} fill-up{fillCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Droplets size={14} className="text-blue-400" />
            <p className="text-xs text-gray-500 font-medium">Liters</p>
          </div>
          <p className="text-xl font-bold text-[#1B4332]">{thisMonthLiters > 0 ? `${thisMonthLiters.toFixed(1)} L` : '—'}</p>
          <p className="text-xs text-gray-400">this month</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#40916C]" />
            <p className="text-xs text-gray-500 font-medium">Avg Price/L</p>
          </div>
          <p className="text-xl font-bold text-[#1B4332]">{avgPpl > 0 ? `₨ ${avgPpl.toFixed(0)}` : '—'}</p>
          <p className="text-xs text-gray-400">per liter</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Target size={14} className="text-purple-400" />
            <p className="text-xs text-gray-500 font-medium">Budget Used</p>
          </div>
          <p className={`text-xl font-bold ${overBudget ? 'text-red-600' : 'text-[#1B4332]'}`}>
            {budget > 0 ? `${budgetUsedPct}%` : '—'}
          </p>
          <p className="text-xs text-gray-400">{budget > 0 ? (overBudget ? 'over budget!' : 'on track') : 'no budget set'}</p>
        </div>
      </div>

      {/* Chart + Recent fills */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 6-month trend */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">6-Month Fuel Spend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Petrol']} />
              <Bar dataKey="total" fill={PETROL_COLOR} radius={[4, 4, 0, 0]} name="Petrol" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent fill-ups */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-[#1B4332]">Fill-up History</h3>
          </div>
          {recentFills.length > 0 ? (
            <div className="divide-y divide-gray-50 max-h-[240px] overflow-y-auto">
              {recentFills.map((f) => (
                <div key={f.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F4EFE6]/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <Fuel size={14} className="text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1C1C1C] truncate">
                        {f.note || 'Petrol fill-up'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(f.date + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                        {f.liters > 0 ? ` · ${f.liters}L` : ''}
                        {f.ppl > 0 ? ` @ ₨${f.ppl}/L` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold tabular-nums text-orange-600">{fmt(f.amount)}</span>
                    <button
                      onClick={() => deleteFill(f.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36 text-center px-6">
              <Fuel size={28} className="text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No fill-ups yet</p>
              <p className="text-gray-300 text-xs mt-1">Tap &ldquo;Add Fill-up&rdquo; to start tracking</p>
            </div>
          )}
        </div>
      </div>

      {/* Spending Autopsy sync note */}
      <div className="bg-[#D8F3DC] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Fuel size={14} className="text-[#74C69D]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1B4332]">Synced with Spending Autopsy</p>
          <p className="text-xs text-[#2D6A4F] mt-0.5">
            Your petrol spend is automatically reflected as a &ldquo;Petrol&rdquo; category in Spending Autopsy and the Dashboard.
            {budget > 0 && ` Budget: ${fmt(budget)}/month.`}
          </p>
        </div>
      </div>
    </div>
  );
}
