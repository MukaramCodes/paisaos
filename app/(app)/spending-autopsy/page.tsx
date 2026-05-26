'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
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
import { AlertTriangle, TrendingDown, TrendingUp, Plus, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  amount: number;
  budget: number;
  type: 'Needs' | 'Wants';
  color: string;
  intentional: boolean;
}

const initCategories: Category[] = [];

const weeklyData = [
  { week: 'Wk 1', needs: 14000, wants: 8000 },
  { week: 'Wk 2', needs: 12500, wants: 9200 },
  { week: 'Wk 3', needs: 11800, wants: 7400 },
  { week: 'Wk 4', needs: 15900, wants: 1800 },
];

const COLORS = ['#1B4332','#2D6A4F','#40916C','#52B788','#74C69D','#d97706','#f59e0b','#fbbf24','#ef4444','#e879f9','#60a5fa','#f87171'];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');

export default function SpendingAutopsyPage() {
  const { dataVersion } = useAuth();
  const [categories, setCategories] = useState<Category[]>(initCategories);
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState<'All' | 'Needs' | 'Wants'>('All');
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({
    name: '',
    amount: '',
    budget: '',
    type: 'Needs' as 'Needs' | 'Wants',
    intentional: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('paisaos_spending');
    if (saved) setCategories(JSON.parse(saved));
    setMounted(true);
  }, [dataVersion]);

  useEffect(() => {
    if (mounted) localStorage.setItem('paisaos_spending', JSON.stringify(categories));
  }, [categories, mounted]);

  const addEntry = () => {
    if (!newEntry.name || !newEntry.amount) return;
    const colorIndex = categories.length % COLORS.length;
    setCategories([...categories, {
      id: Date.now(),
      name: newEntry.name,
      amount: Number(newEntry.amount),
      budget: Number(newEntry.budget) || Number(newEntry.amount),
      type: newEntry.type,
      color: COLORS[colorIndex],
      intentional: newEntry.intentional,
    }]);
    setNewEntry({ name: '', amount: '', budget: '', type: 'Needs', intentional: true });
    setShowAdd(false);
  };

  const deleteEntry = (id: number) => setCategories(categories.filter((c) => c.id !== id));

  const filtered = selectedType === 'All' ? categories : categories.filter((c) => c.type === selectedType);
  const total = filtered.reduce((s, c) => s + c.amount, 0);
  const totalAll = categories.reduce((s, c) => s + c.amount, 0);
  const overBudget = filtered.filter((c) => c.amount > c.budget);
  const autopilot = categories.filter((c) => !c.intentional).reduce((s, c) => s + c.amount, 0);
  const imr = totalAll > 0 ? Math.round(((totalAll - autopilot) / totalAll) * 100) : 100;

  const pieData = filtered.map((c) => ({ name: c.name, value: c.amount, color: c.color }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Spending Autopsy</h1>
          <p className="text-sm text-[#40916C] mt-1">Understand your spending without judgement</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Spending
        </button>
      </div>

      {/* Add Spending Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#1B4332] text-lg mb-4">Add Spending Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Category Name</label>
                <input
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                  placeholder="e.g. Electricity Bill"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount Spent (₨)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 5000"
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Monthly Budget (₨)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newEntry.budget}
                    onChange={(e) => setNewEntry({ ...newEntry, budget: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="e.g. 4000"
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'Needs' | 'Wants' })}
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  >
                    <option value="Needs">Needs</option>
                    <option value="Wants">Wants</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Was it intentional?</label>
                  <select
                    value={newEntry.intentional ? 'yes' : 'no'}
                    onChange={(e) => setNewEntry({ ...newEntry, intentional: e.target.value === 'yes' })}
                    className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                  >
                    <option value="yes">Yes – planned</option>
                    <option value="no">No – autopilot</option>
                  </select>
                </div>
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
                onClick={addEntry}
                className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Total Spent</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{fmt(totalAll)}</p>
          <p className="text-xs text-gray-400">{categories.length} categories</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-xs text-gray-500 font-medium">Intentional Money Rate</p>
          <p className="text-xl font-bold text-[#1B4332] mt-1">{imr}%</p>
          <p className="text-xs text-[#40916C]">{imr >= 70 ? 'Good range' : imr >= 50 ? 'Fair' : 'Needs work'}</p>
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
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
              <div key={c.id} className="bg-white rounded-xl p-3 border border-orange-100">
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-[#1C1C1C] text-sm">{c.name}</p>
                  <span className="text-xs text-red-500 font-bold">+{fmt(c.amount - c.budget)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Spent {fmt(c.amount)} vs budget {fmt(c.budget)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-[#1B4332]">All Categories</h3>
          <span className="text-xs text-gray-400">{categories.length} entries · {fmt(totalAll)} total</span>
        </div>
        <div className="divide-y divide-gray-50">
          {categories.map((c) => {
            const over = c.amount > c.budget;
            const barPct = Math.min(Math.round((c.amount / Math.max(c.budget, 1)) * 100), 150);
            return (
              <div key={c.id} className="px-5 py-4 hover:bg-[#F4EFE6]/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                        style={{ width: `${Math.min(barPct, 100)}%`, backgroundColor: over ? '#ef4444' : c.color }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${over ? 'text-red-500' : 'text-[#1B4332]'}`}>
                      {fmt(c.amount)}
                    </p>
                    <p className="text-xs text-gray-400">of {fmt(c.budget)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {over ? <TrendingUp size={16} className="text-red-400" /> : <TrendingDown size={16} className="text-[#40916C]" />}
                    <button
                      onClick={() => deleteEntry(c.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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
