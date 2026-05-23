'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
  emoji: string;
  current: number;
  target: number;
  deadline: string;
  monthly: number;
  category: string;
}

const initGoals: Goal[] = [
  { id: 1, name: 'Emergency Fund (6 months)', emoji: '🛡️', current: 90000, target: 180000, deadline: '2025-12-31', monthly: 15000, category: 'Protection' },
  { id: 2, name: 'Car Down Payment', emoji: '🚗', current: 220000, target: 600000, deadline: '2026-06-30', monthly: 25000, category: 'Lifestyle' },
  { id: 3, name: 'House Down Payment', emoji: '🏠', current: 800000, target: 5000000, deadline: '2030-01-01', monthly: 40000, category: 'Property' },
  { id: 4, name: 'Hajj Fund', emoji: '🕌', current: 250000, target: 1000000, deadline: '2028-01-01', monthly: 20000, category: 'Spiritual' },
  { id: 5, name: 'Children\'s Education', emoji: '📚', current: 120000, target: 2000000, deadline: '2035-09-01', monthly: 15000, category: 'Education' },
  { id: 6, name: 'Laptop Upgrade', emoji: '💻', current: 45000, target: 80000, deadline: '2025-08-31', monthly: 3600, category: 'Tech' },
];

const fmt = (n: number) => '₨ ' + n.toLocaleString('en-PK');

const monthsToDeadline = (deadline: string) => {
  const d = new Date(deadline);
  const now = new Date();
  const diff = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth());
  return Math.max(0, diff);
};

const projectedCompletion = (goal: Goal) => {
  const remaining = goal.target - goal.current;
  if (goal.monthly <= 0) return '–';
  const months = Math.ceil(remaining / goal.monthly);
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-PK', { month: 'short', year: 'numeric' });
};

const isOnTrack = (goal: Goal) => {
  const remaining = goal.target - goal.current;
  const months = monthsToDeadline(goal.deadline);
  return goal.monthly * months >= remaining;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>(initGoals);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('paisaos_goals');
    if (saved) setGoals(JSON.parse(saved));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('paisaos_goals', JSON.stringify(goals));
  }, [goals, mounted]);

  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', emoji: '🎯', target: '', monthly: '', deadline: '' });
  const [filter, setFilter] = useState<'all' | 'on-track' | 'at-risk'>('all');

  const addGoal = () => {
    if (!newGoal.name || !newGoal.target || !newGoal.deadline) return;
    setGoals([...goals, {
      id: Date.now(),
      name: newGoal.name,
      emoji: newGoal.emoji || '🎯',
      current: 0,
      target: Number(newGoal.target),
      deadline: newGoal.deadline,
      monthly: Number(newGoal.monthly) || 0,
      category: 'Custom',
    }]);
    setNewGoal({ name: '', emoji: '🎯', target: '', monthly: '', deadline: '' });
    setShowAdd(false);
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === 'on-track') return isOnTrack(g) && g.current < g.target;
    if (filter === 'at-risk') return !isOnTrack(g) && g.current < g.target;
    return true;
  });

  const totalProgress = goals.reduce((s, g) => s + g.current, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);
  const completed = goals.filter((g) => g.current >= g.target).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1B4332]">Goals</h1>
          <p className="text-sm text-[#40916C] mt-1">Turn dreams into milestones</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Goals', value: goals.length.toString(), sub: `${completed} completed` },
          { label: 'Total Saved', value: fmt(totalProgress), sub: `of ${fmt(totalTarget)}` },
          { label: 'On Track', value: goals.filter(isOnTrack).length.toString(), sub: 'of active goals' },
          { label: 'Monthly Committed', value: fmt(goals.reduce((s, g) => s + g.monthly, 0)), sub: 'toward goals' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-card">
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-xl font-bold text-[#1B4332] mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'on-track', 'at-risk'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-[#1B4332] text-white'
                : 'bg-white text-[#2D6A4F] border border-[#D8F3DC] hover:bg-[#D8F3DC]'
            }`}
          >
            {f === 'all' ? 'All Goals' : f === 'on-track' ? '✓ On Track' : '⚠ At Risk'}
          </button>
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-[#1B4332] text-lg mb-4">New Financial Goal</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  value={newGoal.emoji}
                  onChange={(e) => setNewGoal({ ...newGoal, emoji: e.target.value })}
                  className="w-16 text-center text-2xl border border-[#D8F3DC] rounded-xl p-2 focus:outline-none"
                  maxLength={2}
                />
                <input
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="Goal name"
                  className="flex-1 border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
              <input
                type="number"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                placeholder="Target amount (PKR)"
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
              />
              <input
                type="number"
                value={newGoal.monthly}
                onChange={(e) => setNewGoal({ ...newGoal, monthly: e.target.value })}
                placeholder="Monthly contribution (PKR)"
                className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
              />
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Target Date</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-[#D8F3DC] rounded-xl text-sm font-medium text-gray-500 hover:bg-[#F4EFE6] transition-colors">Cancel</button>
              <button onClick={addGoal} className="flex-1 py-2.5 bg-[#1B4332] text-white rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors">Add Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const pct = Math.min(Math.round((goal.current / goal.target) * 100), 100);
          const done = goal.current >= goal.target;
          const onTrack = isOnTrack(goal);
          const months = monthsToDeadline(goal.deadline);

          return (
            <div key={goal.id} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Left: emoji + info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4EFE6] flex items-center justify-center text-2xl flex-shrink-0">
                    {goal.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#1B4332]">{goal.name}</h3>
                      {done ? (
                        <span className="text-xs bg-[#D8F3DC] text-[#1B4332] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Complete
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${onTrack ? 'bg-[#D8F3DC] text-[#2D6A4F]' : 'bg-orange-50 text-orange-600'}`}>
                          {onTrack ? '✓ On Track' : '⚠ At Risk'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{goal.category}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="font-semibold text-[#1B4332]">{fmt(goal.current)}</span>
                        <span>{fmt(goal.target)} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-[#F4EFE6] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: done ? '#1B4332' : onTrack ? '#40916C' : '#f97316' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: stats */}
                <div className="grid grid-cols-3 gap-3 sm:w-64 flex-shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Monthly</p>
                    <p className="text-sm font-bold text-[#1B4332]">{fmt(goal.monthly)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Months left</p>
                    <p className="text-sm font-bold text-[#1B4332]">{done ? '–' : months}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Done by</p>
                    <p className="text-sm font-bold text-[#1B4332]">{done ? '✓' : projectedCompletion(goal)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setGoals(goals.filter((g) => g.id !== goal.id))}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
