'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Info, Plus, Trash2 } from 'lucide-react';

interface FlowItem {
  id: number;
  name: string;
  amount: number;
}

interface FlowCategory {
  label: string;
  description: string;
  target: number;
  items: FlowItem[];
  color: string;
}

const defaultCategories: FlowCategory[] = [
  {
    label: 'Needs',
    description: 'Essentials you must pay',
    target: 50,
    items: [],
    color: '#1B4332',
  },
  {
    label: 'Wants',
    description: 'Lifestyle & enjoyment',
    target: 30,
    items: [],
    color: '#40916C',
  },
  {
    label: 'Savings & Investments',
    description: 'Building your future',
    target: 20,
    items: [],
    color: '#74C69D',
  },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');
const pct = (n: number, income: number) => income > 0 ? Math.round((n / income) * 100) : 0;

export default function MoneyFlowPage() {
  const { dataVersion } = useAuth();
  const [income, setIncome] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [categories, setCategories] = useState<FlowCategory[]>(defaultCategories);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedIncome = localStorage.getItem('paisaos_income');
    if (savedIncome) {
      const n = Number(savedIncome);
      setIncome(n);
      setInputVal(n.toString());
    }
    const savedFlow = localStorage.getItem('paisaos_flow');
    if (savedFlow) {
      setCategories(JSON.parse(savedFlow));
    }
    setMounted(true);
  }, [dataVersion]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('paisaos_income', income.toString());
      localStorage.setItem('paisaos_flow', JSON.stringify(categories));
    }
  }, [income, categories, mounted]);

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const stripped = raw.replace(/^0+(\d)/, '$1');
    setInputVal(stripped);
    setIncome(stripped ? parseInt(stripped, 10) : 0);
  };

  const addItem = (catIndex: number) => {
    setCategories((cats) =>
      cats.map((c, i) =>
        i === catIndex
          ? { ...c, items: [...c.items, { id: Date.now(), name: 'New Item', amount: 0 }] }
          : c
      )
    );
  };

  const updateItem = (
    catIndex: number,
    itemId: number,
    field: 'name' | 'amount',
    value: string | number
  ) => {
    setCategories((cats) =>
      cats.map((c, i) =>
        i === catIndex
          ? { ...c, items: c.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)) }
          : c
      )
    );
  };

  const deleteItem = (catIndex: number, itemId: number) => {
    setCategories((cats) =>
      cats.map((c, i) =>
        i === catIndex ? { ...c, items: c.items.filter((item) => item.id !== itemId) } : c
      )
    );
  };

  const totalSpent = categories.flatMap((c) => c.items).reduce((s, i) => s + i.amount, 0);
  const unallocated = income - totalSpent;

  const chartData = categories.map((c) => ({
    name: c.label === 'Savings & Investments' ? 'Savings' : c.label,
    amount: c.items.reduce((s, i) => s + i.amount, 0),
    color: c.color,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
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

      {/* Flow Breakdown — fully editable */}
      <div className="grid lg:grid-cols-3 gap-6">
        {categories.map((cat, catIndex) => {
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

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{fmt(catTotal)}</span>
                  <span className={targetDiff > 0 ? 'text-red-500' : 'text-[#2D6A4F]'}>
                    Target: {cat.target}%{targetDiff !== 0 ? ` (${targetDiff > 0 ? '+' : ''}${targetDiff}%)` : ''}
                  </span>
                </div>
                <div className="h-2.5 bg-[#F4EFE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(catPct, 100)}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {cat.items.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No items yet — add one below</p>
                )}
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(catIndex, item.id, 'name', e.target.value)}
                      className="flex-1 text-sm text-gray-600 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-[#40916C] focus:outline-none px-1 min-w-0"
                    />
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateItem(catIndex, item.id, 'amount', Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-24 text-sm font-medium text-right bg-[#F4EFE6] border border-transparent hover:border-gray-200 focus:border-[#40916C] focus:outline-none rounded-lg px-2 py-1 tabular-nums"
                    />
                    <button
                      onClick={() => deleteItem(catIndex, item.id)}
                      className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => addItem(catIndex)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-[#40916C] bg-[#F4EFE6] hover:bg-[#D8F3DC] rounded-lg py-2 transition-colors"
              >
                <Plus size={12} /> Add Item
              </button>
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
          {categories.map((cat) => {
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

      {/* Chart from real entered data */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-[#1B4332] mb-4">This Month&apos;s Breakdown</h3>
        {totalSpent > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={52}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Amount']} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center bg-[#F4EFE6] rounded-xl">
            <p className="text-sm text-gray-400">Add items above to see your breakdown chart</p>
          </div>
        )}
      </div>
    </div>
  );
}
