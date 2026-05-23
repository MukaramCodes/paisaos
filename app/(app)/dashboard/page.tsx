'use client';

import { useState } from 'react';
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
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PiggyBank,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';

const netWorthHistory = [
  { month: 'Nov', value: 620000 },
  { month: 'Dec', value: 680000 },
  { month: 'Jan', value: 710000 },
  { month: 'Feb', value: 730000 },
  { month: 'Mar', value: 790000 },
  { month: 'Apr', value: 820000 },
  { month: 'May', value: 840000 },
];

const spendingData = [
  { name: 'Needs', value: 60000, color: '#1B4332' },
  { name: 'Wants', value: 26400, color: '#40916C' },
  { name: 'Savings', value: 33600, color: '#74C69D' },
];

const recentTransactions = [
  { desc: 'Utility Bills (LESCO)', amount: -8200, cat: 'Needs', date: 'Today' },
  { desc: 'Salary Credit', amount: 120000, cat: 'Income', date: 'May 1' },
  { desc: 'Careem Ride', amount: -850, cat: 'Wants', date: 'May 21' },
  { desc: 'Savings Pot – Emergency', amount: -15000, cat: 'Savings', date: 'May 1' },
  { desc: 'Grocery – Imtiaz', amount: -7400, cat: 'Needs', date: 'May 20' },
  { desc: 'Netflix', amount: -1100, cat: 'Wants', date: 'May 15' },
];

const fmt = (n: number) =>
  '₨ ' + Math.abs(n).toLocaleString('en-PK');

export default function DashboardPage() {
  const [imr] = useState(73);

  const imrLabel = imr >= 80 ? 'Excellent' : imr >= 65 ? 'Good' : imr >= 50 ? 'Fair' : 'Needs work';
  const imrColor = imr >= 80 ? '#2D6A4F' : imr >= 65 ? '#40916C' : imr >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Good morning, Ali 👋</h1>
        <p className="text-sm text-[#40916C] mt-1">Here&apos;s your financial pulse for May 2025</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Income"
          value="₨ 1,20,000"
          subtitle="May 2025"
          icon={Wallet}
          trend={{ value: '5% vs Apr', positive: true }}
          accent="green"
        />
        <MetricCard
          title="Total Spent"
          value="₨ 86,400"
          subtitle="72% of income"
          icon={TrendingDown}
          trend={{ value: '₨ 8,200 less', positive: true }}
          accent="amber"
        />
        <MetricCard
          title="Net Worth"
          value="₨ 8,40,000"
          subtitle="Assets - Liabilities"
          icon={TrendingUp}
          trend={{ value: '12% YoY', positive: true }}
          accent="green"
        />
        <MetricCard
          title="Savings Rate"
          value="28%"
          subtitle="₨ 33,600 saved"
          icon={PiggyBank}
          trend={{ value: '+3% vs goal', positive: true }}
          accent="green"
        />
      </div>

      {/* IMR + Spending Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* IMR Card */}
        <div className="bg-[#1B4332] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-[#74C69D]" />
            <p className="text-sm font-semibold text-[#D8F3DC] uppercase tracking-wide">
              Intentional Money Rate
            </p>
          </div>
          <div className="flex items-end justify-between mb-4">
            <p className="text-5xl font-extrabold">{imr}%</p>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{ backgroundColor: `${imrColor}33`, color: imrColor === '#2D6A4F' ? '#74C69D' : imrColor }}
            >
              {imrLabel}
            </span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#74C69D] to-[#40916C] transition-all duration-700"
              style={{ width: `${imr}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#D8F3DC]/60">
            <span>0%</span>
            <span className="text-[#74C69D] font-medium">Target: 80%</span>
            <span>100%</span>
          </div>
          <p className="text-xs text-[#D8F3DC]/70 mt-4 leading-relaxed">
            73% of your spending was intentional this month. Autopilot cost you ₨ 23,300.
          </p>
        </div>

        {/* Spending Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">Spending Split</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={spendingData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {spendingData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Goals snapshot */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Active Goals</h3>
            <a href="/goals" className="text-xs text-[#40916C] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Emergency Fund', current: 90000, target: 180000 },
              { name: 'Car Down Payment', current: 220000, target: 600000 },
              { name: 'Laptop Upgrade', current: 45000, target: 80000 },
            ].map((g) => {
              const pct = Math.round((g.current / g.target) * 100);
              return (
                <div key={g.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-[#1C1C1C]">{g.name}</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[#F4EFE6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#40916C] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmt(g.current)} of {fmt(g.target)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Net Worth Chart + Transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Net Worth Trend</h3>
            <span className="text-xs bg-[#D8F3DC] text-[#2D6A4F] px-2 py-1 rounded-full font-semibold">6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={netWorthHistory}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#40916C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#40916C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `₨${(v / 100000).toFixed(1)}L`}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(v: number) => [fmt(v), 'Net Worth']} />
              <Area type="monotone" dataKey="value" stroke="#40916C" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Recent Activity</h3>
            <a href="/spending-autopsy" className="text-xs text-[#40916C] font-medium flex items-center gap-1 hover:underline">
              Full analysis <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F4EFE6] flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#40916C]">{t.cat.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1C1C1C] leading-tight">{t.desc}</p>
                    <p className="text-xs text-gray-400">{t.date} · {t.cat}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold tabular-nums ${t.amount > 0 ? 'text-[#2D6A4F]' : 'text-[#1C1C1C]'}`}>
                  {t.amount > 0 ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Transaction', href: '/spending-autopsy', icon: '➕' },
          { label: 'Top Up a Pot', href: '/savings-pots', icon: '🏺' },
          { label: 'Update Net Worth', href: '/net-worth', icon: '📊' },
          { label: 'Run a Calculation', href: '/calculators', icon: '🧮' },
        ].map((a) => (
          <a
            key={a.label}
            href={a.href}
            className="bg-white rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex items-center gap-3"
          >
            <span className="text-xl">{a.icon}</span>
            <span className="text-sm font-medium text-[#1B4332]">{a.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
