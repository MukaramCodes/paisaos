'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Plus, Trash2 } from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  amount: number;
  category: string;
  color: string;
}

interface Liability {
  id: number;
  name: string;
  amount: number;
  category: string;
}

const initAssets: Asset[] = [];

const initLiabilities: Liability[] = [];

const historyData = [
  { month: 'Nov', netWorth: 620000 },
  { month: 'Dec', netWorth: 680000 },
  { month: 'Jan', netWorth: 710000 },
  { month: 'Feb', netWorth: 730000 },
  { month: 'Mar', netWorth: 790000 },
  { month: 'Apr', netWorth: 820000 },
  { month: 'May', netWorth: 840000 },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');

export default function NetWorthPage() {
  const { dataVersion } = useAuth();
  const [assets, setAssets] = useState<Asset[]>(initAssets);
  const [liabilities, setLiabilities] = useState<Liability[]>(initLiabilities);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const a = localStorage.getItem('paisaos_assets');
    const l = localStorage.getItem('paisaos_liabilities');
    if (a) setAssets(JSON.parse(a));
    if (l) setLiabilities(JSON.parse(l));
    setMounted(true);
  }, [dataVersion]);

  useEffect(() => {
    if (mounted) localStorage.setItem('paisaos_assets', JSON.stringify(assets));
  }, [assets, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('paisaos_liabilities', JSON.stringify(liabilities));
  }, [liabilities, mounted]);

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLiability, setShowAddLiability] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', amount: '', category: 'Cash' });
  const [newLiability, setNewLiability] = useState({ name: '', amount: '', category: 'Loan' });

  const totalAssets = assets.reduce((s, a) => s + a.amount, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  const addAsset = () => {
    if (!newAsset.name || !newAsset.amount) return;
    const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D'];
    setAssets([...assets, { id: Date.now(), name: newAsset.name, amount: Number(newAsset.amount), category: newAsset.category, color: colors[assets.length % colors.length] }]);
    setNewAsset({ name: '', amount: '', category: 'Cash' });
    setShowAddAsset(false);
  };

  const addLiability = () => {
    if (!newLiability.name || !newLiability.amount) return;
    setLiabilities([...liabilities, { id: Date.now(), name: newLiability.name, amount: Number(newLiability.amount), category: newLiability.category }]);
    setNewLiability({ name: '', amount: '', category: 'Loan' });
    setShowAddLiability(false);
  };

  const assetsByCategory = Object.entries(
    assets.reduce((acc, a) => ({ ...acc, [a.category]: (acc[a.category] || 0) + a.amount }), {} as Record<string, number>)
  ).map(([name, value], i) => ({ name, value, color: ['#1B4332', '#40916C', '#74C69D', '#D8F3DC', '#52B788', '#2D6A4F'][i % 6] }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Net Worth</h1>
        <p className="text-sm text-[#40916C] mt-1">Track what you own vs what you owe — in real time</p>
      </div>

      {/* Top Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#1B4332] rounded-2xl p-6 text-white">
          <p className="text-sm text-[#D8F3DC] font-medium mb-1">Total Assets</p>
          <p className="text-3xl font-extrabold">{fmt(totalAssets)}</p>
          <p className="text-xs text-[#74C69D] mt-1">What you own</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-6">
          <p className="text-sm text-gray-500 font-medium mb-1">Total Liabilities</p>
          <p className="text-3xl font-extrabold text-red-600">{fmt(totalLiabilities)}</p>
          <p className="text-xs text-gray-400 mt-1">What you owe</p>
        </div>
        <div className="bg-[#D8F3DC] rounded-2xl p-6">
          <p className="text-sm text-[#1B4332] font-medium mb-1">Net Worth</p>
          <p className={`text-3xl font-extrabold ${netWorth >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
            {fmt(Math.abs(netWorth))}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[#2D6A4F]">↑ {fmt(20000)} vs last month</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">Net Worth Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="nwGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40916C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40916C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [fmt(v), 'Net Worth']} />
              <Area type="monotone" dataKey="netWorth" stroke="#40916C" strokeWidth={2} fill="url(#nwGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">Asset Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={assetsByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {assetsByCategory.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assets + Liabilities Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#1B4332]">Assets · {fmt(totalAssets)}</h3>
            <button
              onClick={() => setShowAddAsset(true)}
              className="flex items-center gap-1 text-xs font-semibold text-[#40916C] bg-[#D8F3DC] px-3 py-1.5 rounded-lg hover:bg-[#B7E4C7] transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {showAddAsset && (
            <div className="p-4 bg-[#F4EFE6] border-b border-gray-100 space-y-3">
              <div className="flex gap-2">
                <input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="Asset name" className="flex-1 border border-[#D8F3DC] rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                <input type="number" value={newAsset.amount} onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
                  placeholder="Amount" className="w-28 border border-[#D8F3DC] rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
              </div>
              <select value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                className="w-full border border-[#D8F3DC] rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                {['Cash', 'Investments', 'Property', 'Vehicles', 'Physical Assets', 'Personal'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addAsset} className="flex-1 bg-[#1B4332] text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-[#2D6A4F]">Save</button>
                <button onClick={() => setShowAddAsset(false)} className="px-3 text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {assets.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F4EFE6]/50">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                  <div>
                    <p className="text-sm font-medium text-[#1C1C1C]">{a.name}</p>
                    <p className="text-xs text-gray-400">{a.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#1B4332] tabular-nums">{fmt(a.amount)}</span>
                  <button onClick={() => setAssets(assets.filter((x) => x.id !== a.id))} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#1B4332]">Liabilities · <span className="text-red-500">{fmt(totalLiabilities)}</span></h3>
            <button
              onClick={() => setShowAddLiability(true)}
              className="flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Plus size={12} /> Add
            </button>
          </div>

          {showAddLiability && (
            <div className="p-4 bg-[#F4EFE6] border-b border-gray-100 space-y-3">
              <div className="flex gap-2">
                <input value={newLiability.name} onChange={(e) => setNewLiability({ ...newLiability, name: e.target.value })}
                  placeholder="Liability name" className="flex-1 border border-[#D8F3DC] rounded-lg px-3 py-1.5 text-sm focus:outline-none" />
                <input type="number" value={newLiability.amount} onChange={(e) => setNewLiability({ ...newLiability, amount: e.target.value })}
                  placeholder="Amount" className="w-28 border border-[#D8F3DC] rounded-lg px-2 py-1.5 text-sm focus:outline-none" />
              </div>
              <select value={newLiability.category} onChange={(e) => setNewLiability({ ...newLiability, category: e.target.value })}
                className="w-full border border-[#D8F3DC] rounded-lg px-3 py-1.5 text-sm focus:outline-none">
                {['Loan', 'Credit Card', 'Personal Loan', 'Mortgage', 'Other'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={addLiability} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700">Save</button>
                <button onClick={() => setShowAddLiability(false)} className="px-3 text-gray-400 hover:text-gray-600 text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {liabilities.map((l) => (
              <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-[#F4EFE6]/50">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#1C1C1C]">{l.name}</p>
                    <p className="text-xs text-gray-400">{l.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-red-500 tabular-nums">{fmt(l.amount)}</span>
                  <button onClick={() => setLiabilities(liabilities.filter((x) => x.id !== l.id))} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Net Worth Summary at bottom */}
          <div className="p-5 bg-[#F4EFE6] border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#1B4332]">Net Worth</span>
              <span className={`text-lg font-extrabold ${netWorth >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                {fmt(netWorth)}
              </span>
            </div>
            <div className="mt-2 h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#40916C]"
                style={{ width: `${Math.min((netWorth / totalAssets) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              {Math.round((netWorth / totalAssets) * 100)}% of assets are truly yours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
