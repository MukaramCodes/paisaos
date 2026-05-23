'use client';

import { useState } from 'react';
import { Plus, Target, Trash2, TrendingUp } from 'lucide-react';

interface Pot {
  id: number;
  name: string;
  emoji: string;
  current: number;
  target: number;
  color: string;
  monthlyAdd: number;
}

const initPots: Pot[] = [
  { id: 1, name: 'Emergency Fund', emoji: '🛡️', current: 90000, target: 180000, color: '#1B4332', monthlyAdd: 15000 },
  { id: 2, name: 'Eid Shopping', emoji: '🎁', current: 18000, target: 30000, color: '#40916C', monthlyAdd: 5000 },
  { id: 3, name: 'Hajj Fund', emoji: '🕌', current: 250000, target: 1000000, color: '#2D6A4F', monthlyAdd: 20000 },
  { id: 4, name: 'Laptop Upgrade', emoji: '💻', current: 45000, target: 80000, color: '#74C69D', monthlyAdd: 3600 },
  { id: 5, name: 'Vacation – North', emoji: '🏔️', current: 22000, target: 60000, color: '#52B788', monthlyAdd: 8000 },
  { id: 6, name: 'Car Down Payment', emoji: '🚗', current: 220000, target: 600000, color: '#095D40', monthlyAdd: 10000 },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');

export default function SavingsPotsPage() {
  const [pots, setPots] = useState<Pot[]>(initPots);
  const [showAdd, setShowAdd] = useState(false);
  const [newPot, setNewPot] = useState({ name: '', emoji: '💰', target: '', monthlyAdd: '' });
  const [topUpId, setTopUpId] = useState<number | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  const totalSaved = pots.reduce((s, p) => s + p.current, 0);
  const totalTarget = pots.reduce((s, p) => s + p.target, 0);

  const addPot = () => {
    if (!newPot.name || !newPot.target) return;
    setPots([...pots, {
      id: Date.now(),
      name: newPot.name,
      emoji: newPot.emoji || '💰',
      current: 0,
      target: Number(newPot.target),
      color: '#40916C',
      monthlyAdd: Number(newPot.monthlyAdd) || 0,
    }]);
    setNewPot({ name: '', emoji: '💰', target: '', monthlyAdd: '' });
    setShowAdd(false);
  };

  const deletePot = (id: number) => setPots(pots.filter((p) => p.id !== id));

  const topUp = (id: number) => {
    const amt = Number(topUpAmount);
    if (!amt || amt <= 0) return;
    setPots(pots.map((p) => p.id === id ? { ...p, current: Math.min(p.current + amt, p.target) } : p));
    setTopUpId(null);
    setTopUpAmount('');
  };

  const monthsLeft = (pot: Pot) => {
    const remaining = pot.target - pot.current;
    if (pot.monthlyAdd <= 0) return '–';
    return Math.ceil(remaining / pot.monthlyAdd) + ' months';
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Savings Pots</h1>
          <p className="text-sm text-[#40916C] mt-1">Purpose-driven savings for every goal</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors shadow-sm"
        >
          <Plus size={16} /> New Pot
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Saved', value: fmt(totalSaved), sub: `across ${pots.length} pots` },
          { label: 'Total Target', value: fmt(totalTarget), sub: 'combined goal' },
          { label: 'Overall Progress', value: `${Math.round((totalSaved / totalTarget) * 100)}%`, sub: 'toward all goals' },
          { label: 'Monthly Commitment', value: fmt(pots.reduce((s, p) => s + p.monthlyAdd, 0)), sub: 'auto-allocated' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-xl font-bold text-[#1B4332] mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Add Pot Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#1B4332] text-lg mb-4">Create New Pot</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  value={newPot.emoji}
                  onChange={(e) => setNewPot({ ...newPot, emoji: e.target.value })}
                  className="w-16 text-center text-2xl border border-[#D8F3DC] rounded-xl p-2 focus:outline-none"
                  maxLength={2}
                  placeholder="💰"
                />
                <input
                  value={newPot.name}
                  onChange={(e) => setNewPot({ ...newPot, name: e.target.value })}
                  placeholder="Pot name (e.g. Hajj Fund)"
                  className="flex-1 border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Amount (PKR)</label>
                <input
                  type="number"
                  value={newPot.target}
                  onChange={(e) => setNewPot({ ...newPot, target: e.target.value })}
                  placeholder="e.g. 500000"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Monthly Contribution (PKR)</label>
                <input
                  type="number"
                  value={newPot.monthlyAdd}
                  onChange={(e) => setNewPot({ ...newPot, monthlyAdd: e.target.value })}
                  placeholder="e.g. 10000"
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
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
                onClick={addPot}
                className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                Create Pot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pots Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pots.map((pot) => {
          const pct = Math.min(Math.round((pot.current / pot.target) * 100), 100);
          const isComplete = pot.current >= pot.target;
          return (
            <div key={pot.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: pot.color + '22' }}
                  >
                    {pot.emoji}
                  </div>
                  <div>
                    <p className="font-bold text-[#1B4332]">{pot.name}</p>
                    <p className="text-xs text-gray-400">{isComplete ? '🎉 Goal reached!' : `${monthsLeft(pot)} to go`}</p>
                  </div>
                </div>
                <button
                  onClick={() => deletePot(pot.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span className="font-semibold text-[#1B4332]">{fmt(pot.current)}</span>
                  <span>{fmt(pot.target)}</span>
                </div>
                <div className="h-3 bg-[#F4EFE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: isComplete ? '#1B4332' : pot.color }}
                  />
                </div>
                <p className="text-right text-xs text-gray-400 mt-1">{pct}% complete</p>
              </div>

              {/* Monthly add */}
              <div className="flex items-center justify-between bg-[#F4EFE6] rounded-xl px-3 py-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-[#40916C]" />
                  <span className="text-xs text-gray-500">Monthly</span>
                </div>
                <span className="text-xs font-bold text-[#1B4332]">{fmt(pot.monthlyAdd)}</span>
              </div>

              {/* Top up */}
              {topUpId === pot.id ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                    autoFocus
                  />
                  <button
                    onClick={() => topUp(pot.id)}
                    className="bg-[#1B4332] text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setTopUpId(null); setTopUpAmount(''); }}
                    className="text-gray-400 hover:text-gray-600 px-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setTopUpId(pot.id); setTopUpAmount(''); }}
                  disabled={isComplete}
                  className="w-full py-2 border border-[#D8F3DC] rounded-xl text-sm font-medium text-[#2D6A4F] hover:bg-[#D8F3DC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isComplete ? '✓ Complete' : '+ Top Up'}
                </button>
              )}
            </div>
          );
        })}

        {/* Add new pot tile */}
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#F4EFE6] rounded-2xl p-5 border-2 border-dashed border-[#D8F3DC] hover:border-[#40916C] hover:bg-[#D8F3DC]/20 transition-all flex flex-col items-center justify-center gap-3 min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Plus size={22} className="text-[#40916C]" />
          </div>
          <p className="text-sm font-semibold text-[#2D6A4F]">Create a Pot</p>
          <p className="text-xs text-gray-400 text-center">Every goal deserves its own pot</p>
        </button>
      </div>

      {/* Tips */}
      <div className="bg-[#1B4332] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-[#74C69D]" />
          <h3 className="font-bold text-white">Pot Strategy Tips</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { tip: 'Emergency first', desc: 'Always fill your emergency pot to 3–6 months of expenses before other goals.' },
            { tip: 'Name with purpose', desc: 'Specific names like "Paris Trip 2026" beat vague ones like "Travel" — you\'ll contribute more.' },
            { tip: 'Automate monthly', desc: 'Set up standing orders on payday so pots fill before lifestyle spending begins.' },
          ].map((t) => (
            <div key={t.tip} className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold text-[#D8F3DC] text-sm mb-1">{t.tip}</p>
              <p className="text-xs text-[#D8F3DC]/70 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
