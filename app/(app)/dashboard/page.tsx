'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
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
import { getTransactions, calcWallet, thisMonthTxs, fmt, Transaction } from '@/lib/transactions';
import { getLoans, Loan } from '@/lib/loans';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { dataVersion, uid } = useAuth();
  const [userName, setUserName] = useState('');
  const [income, setIncome] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [spendCategories, setSpendCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans]               = useState<Loan[]>([]);

  useEffect(() => {
    localStorage.setItem('paisaos_visited', 'true');

    const savedName = localStorage.getItem('paisaos_username');
    if (savedName) setUserName(savedName);

    const savedIncome = localStorage.getItem('paisaos_income');
    if (savedIncome) setIncome(Number(savedIncome));

    const savedAssets = localStorage.getItem('paisaos_assets');
    if (savedAssets) {
      const arr = JSON.parse(savedAssets);
      setTotalAssets(arr.reduce((s: number, a: any) => s + (a.amount || 0), 0));
    }

    const savedLiabilities = localStorage.getItem('paisaos_liabilities');
    if (savedLiabilities) {
      const arr = JSON.parse(savedLiabilities);
      setTotalLiabilities(arr.reduce((s: number, l: any) => s + (l.amount || 0), 0));
    }

    const savedSpending = localStorage.getItem('paisaos_spending');
    if (savedSpending) setSpendCategories(JSON.parse(savedSpending));

    const savedGoals = localStorage.getItem('paisaos_goals');
    if (savedGoals) setGoals(JSON.parse(savedGoals));
  }, [dataVersion]);

  useEffect(() => {
    if (!uid) return;
    getTransactions(uid).then(setTransactions).catch(() => {});
    getLoans(uid).then(setLoans).catch(() => {});
  }, [uid, dataVersion]);

  const netWorth = totalAssets - totalLiabilities;
  const totalSpent = spendCategories.reduce((s, c) => s + (c.amount || 0), 0);
  const savingsAmount = Math.max(0, income - totalSpent);
  const savingsRate = income > 0 ? Math.round((savingsAmount / income) * 100) : 0;
  const intentionalSpend = spendCategories
    .filter((c) => c.intentional)
    .reduce((s, c) => s + (c.amount || 0), 0);
  const imr = totalSpent > 0 ? Math.round((intentionalSpend / totalSpent) * 100) : 0;

  const needsTotal = spendCategories.filter((c) => c.type === 'Needs').reduce((s, c) => s + (c.amount || 0), 0);
  const wantsTotal = spendCategories.filter((c) => c.type === 'Wants').reduce((s, c) => s + (c.amount || 0), 0);
  const spendingData = [
    { name: 'Needs', value: needsTotal, color: '#1B4332' },
    { name: 'Wants', value: wantsTotal, color: '#40916C' },
    { name: 'Savings', value: savingsAmount, color: '#74C69D' },
  ].filter((d) => d.value > 0);

  const imrLabel = imr >= 80 ? 'Excellent' : imr >= 65 ? 'Good' : imr >= 50 ? 'Fair' : 'Needs work';
  const imrColor = imr >= 80 ? '#2D6A4F' : imr >= 65 ? '#40916C' : imr >= 50 ? '#d97706' : '#dc2626';
  const monthLabel = new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  const activeGoals = goals.slice(0, 3);

  const monthTxs = thisMonthTxs(transactions);
  const { balance: walletBalance, totalIn: mIn, totalOut: mOut, loanIn, loanOut } = calcWallet(monthTxs);
  const recentTxs     = transactions.slice(0, 5);
  const activeLoans   = loans.filter(l => l.status === 'active');
  const loanRemaining = activeLoans.reduce((s, l) => s + l.remaining_amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">
          {getGreeting()}{userName ? `, ${userName}` : ''} 👋
        </h1>
        <p className="text-sm text-[#40916C] mt-1">Here&apos;s your financial pulse for {monthLabel} · v2.0 ✦</p>
      </div>

      {/* Wallet Balance Banner */}
      <div className={`rounded-2xl p-5 text-white shadow-lg ${walletBalance < 0 ? 'bg-red-600' : 'bg-[#1B4332]'}`}>
        <div className="flex items-center justify-between mb-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${walletBalance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>
            {walletBalance < 0 ? '⚠ Overdrawn This Month' : 'This Month\'s Balance'}
          </p>
          <a href="/wallet" className={`text-xs flex items-center gap-1 hover:text-white transition-colors ${walletBalance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>
            Open wallet <ArrowUpRight size={11} />
          </a>
        </div>
        <p className="text-4xl font-extrabold tracking-tight mb-4">{fmt(walletBalance)}</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/10 rounded-xl p-3">
            <p className={`text-xs mb-0.5 ${walletBalance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>This month in</p>
            <p className="text-base font-bold">{fmt(mIn)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xs text-red-300 mb-0.5">This month out</p>
            <p className="text-base font-bold">{fmt(mOut)}</p>
          </div>
          {loanIn > 0 && (
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-blue-200 mb-0.5">Loan Received</p>
              <p className="text-base font-bold">{fmt(loanIn)}</p>
            </div>
          )}
          {activeLoans.length > 0 && (
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-xs text-orange-200 mb-0.5">Active Loans</p>
              <p className="text-base font-bold">{fmt(loanRemaining)}</p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <a href="/wallet" className="flex-1 text-center bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            + Add Income
          </a>
          <a href="/wallet" className="flex-1 text-center bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            − Add Expense
          </a>
          <a href="/wallet" className="flex-1 text-center bg-white/15 hover:bg-white/25 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Loans
          </a>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Income"
          value={fmt(income)}
          subtitle={monthLabel}
          icon={Wallet}
          accent="green"
        />
        <MetricCard
          title="Total Spent"
          value={fmt(totalSpent)}
          subtitle={income > 0 ? `${Math.round((totalSpent / income) * 100)}% of income` : 'No income set'}
          icon={TrendingDown}
          accent="amber"
        />
        <MetricCard
          title="Net Worth"
          value={fmt(Math.abs(netWorth))}
          subtitle="Assets - Liabilities"
          icon={TrendingUp}
          accent="green"
        />
        <MetricCard
          title="Savings Rate"
          value={`${savingsRate}%`}
          subtitle={savingsAmount > 0 ? `${fmt(savingsAmount)} saved` : 'No data yet'}
          icon={PiggyBank}
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
            {imr > 0 && (
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: `${imrColor}33`, color: imrColor === '#2D6A4F' ? '#74C69D' : imrColor }}
              >
                {imrLabel}
              </span>
            )}
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
            {imr > 0
              ? `${imr}% of your spending was intentional this month.`
              : 'Add spending data in Spending Autopsy to calculate your IMR score.'}
          </p>
        </div>

        {/* Spending Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <h3 className="font-bold text-[#1B4332] mb-4">Spending Split</h3>
          {spendingData.length > 0 ? (
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
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm">No spending data yet</p>
              <a href="/spending-autopsy" className="text-[#40916C] text-xs mt-1 font-medium hover:underline">
                Add spending →
              </a>
            </div>
          )}
        </div>

        {/* Goals snapshot */}
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Active Goals</h3>
            <a href="/goals" className="text-xs text-[#40916C] font-medium flex items-center gap-1 hover:underline">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          {activeGoals.length > 0 ? (
            <div className="space-y-4">
              {activeGoals.map((g) => {
                const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-[#1C1C1C]">{g.emoji} {g.name}</span>
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
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-center">
              <Target size={24} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No goals yet</p>
              <a href="/goals" className="text-[#40916C] text-xs mt-1 font-medium hover:underline">
                Create a goal →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Net Worth Summary + Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Net Worth</h3>
            <a href="/net-worth" className="text-xs text-[#40916C] font-medium flex items-center gap-1 hover:underline">
              Manage <ArrowUpRight size={12} />
            </a>
          </div>
          {totalAssets > 0 || totalLiabilities > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-[#F4EFE6]">
                <span className="text-sm text-gray-500">Total Assets</span>
                <span className="text-sm font-bold text-[#1B4332]">{fmt(totalAssets)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#F4EFE6]">
                <span className="text-sm text-gray-500">Total Liabilities</span>
                <span className="text-sm font-bold text-red-500">{fmt(totalLiabilities)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-[#1B4332]">Net Worth</span>
                <span className={`text-lg font-extrabold ${netWorth >= 0 ? 'text-[#1B4332]' : 'text-red-600'}`}>
                  {netWorth < 0 ? '-' : ''}{fmt(Math.abs(netWorth))}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <TrendingUp size={28} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No net worth data yet</p>
              <a href="/net-worth" className="text-[#40916C] text-xs mt-1 font-medium hover:underline">
                Add assets &amp; liabilities →
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1B4332]">Wallet</h3>
            <a href="/wallet" className="text-xs text-[#40916C] font-medium flex items-center gap-1 hover:underline">
              Open wallet <ArrowUpRight size={12} />
            </a>
          </div>
          {transactions.length > 0 ? (
            <>
              <div className={`rounded-xl p-4 mb-4 text-white ${walletBalance < 0 ? 'bg-red-600' : 'bg-[#1B4332]'}`}>
                <p className={`text-xs font-medium mb-0.5 ${walletBalance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>
                  {walletBalance < 0 ? '⚠ Overdrawn' : 'Balance'}
                </p>
                <p className="text-2xl font-extrabold">{fmt(walletBalance)}</p>
                <div className={`flex gap-4 mt-2 text-xs ${walletBalance < 0 ? 'text-red-200' : 'text-[#74C69D]'}`}>
                  <span>↑ {fmt(mIn)} this month</span>
                  <span>↓ {fmt(mOut)} this month</span>
                </div>
              </div>
              <div className="space-y-2">
                {recentTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        tx.type === 'income'        ? 'bg-[#D8F3DC] text-[#1B4332]' :
                        tx.type === 'loan_received' ? 'bg-blue-50 text-blue-600'    :
                        tx.type === 'loan_payment'  ? 'bg-orange-50 text-orange-600' :
                        'bg-red-50 text-red-500'
                      }`}>
                        {tx.type === 'income' ? '↑' : tx.type === 'loan_received' ? '←' : tx.type === 'loan_payment' ? '→' : '↓'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{tx.category}</p>
                        <p className="text-[10px] text-gray-400">{tx.note || new Date(tx.date + 'T00:00:00').toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${
                      tx.type === 'income' || tx.type === 'loan_received' ? 'text-[#1B4332]' :
                      tx.type === 'loan_payment' ? 'text-orange-600' : 'text-red-500'
                    }`}>
                      {tx.type === 'income' || tx.type === 'loan_received' ? '+' : '-'}{fmt(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Wallet size={28} className="text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">No transactions yet</p>
              <a href="/wallet" className="text-[#40916C] text-xs mt-1 font-medium hover:underline">
                Add income or expense →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Add Transaction', href: '/wallet', icon: '➕' },
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
