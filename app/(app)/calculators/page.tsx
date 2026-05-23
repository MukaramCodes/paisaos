'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Calculator, TrendingUp, Home, Car } from 'lucide-react';

const fmt = (n: number) => '₨ ' + Math.round(n).toLocaleString('en-PK');

// --- EMI Calculator ---
function EmiCalculator() {
  const [principal, setPrincipal] = useState(2000000);
  const [rate, setRate] = useState(22);
  const [years, setYears] = useState(5);

  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  const totalPay = emi * n;
  const totalInterest = totalPay - principal;

  const schedule = Array.from({ length: Math.min(n, 60) }, (_, i) => {
    const outstanding = principal * Math.pow(1 + monthlyRate, i + 1) - emi * ((Math.pow(1 + monthlyRate, i + 1) - 1) / monthlyRate);
    return { month: i + 1, balance: Math.max(0, outstanding) };
  });

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loan Amount (PKR)</label>
          <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Annual Interest Rate (%)</label>
          <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.5"
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loan Term (years)</label>
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} max={30}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1B4332] rounded-xl p-4 text-white text-center">
          <p className="text-xs text-[#D8F3DC] font-medium mb-1">Monthly EMI</p>
          <p className="text-xl font-extrabold">{fmt(emi)}</p>
        </div>
        <div className="bg-[#F4EFE6] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Payment</p>
          <p className="text-xl font-bold text-[#1B4332]">{fmt(totalPay)}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Interest</p>
          <p className="text-xl font-bold text-red-600">{fmt(totalInterest)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Loan Balance Over Time</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={schedule}>
            <defs>
              <linearGradient id="loanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4332" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'months', position: 'insideRight', fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [fmt(v), 'Outstanding']} />
            <Area type="monotone" dataKey="balance" stroke="#1B4332" strokeWidth={2} fill="url(#loanGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Savings Growth Calculator ---
function SavingsCalculator() {
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [initial, setInitial] = useState(50000);

  const data = Array.from({ length: years + 1 }, (_, i) => {
    const contributed = initial + monthly * 12 * i;
    const grown = initial * Math.pow(1 + rate / 100, i) +
      monthly * 12 * ((Math.pow(1 + rate / 100, i) - 1) / (rate / 100));
    return { year: i, contributed, grown };
  });

  const final = data[years];

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Initial Amount (PKR)</label>
          <input type="number" value={initial} onChange={(e) => setInitial(Number(e.target.value))}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Monthly Savings (PKR)</label>
          <input type="number" value={monthly} onChange={(e) => setMonthly(Number(e.target.value))}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Annual Return Rate (%)</label>
          <input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} step="0.5"
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Investment Period (years)</label>
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={1} max={40}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1B4332] rounded-xl p-4 text-white text-center">
          <p className="text-xs text-[#D8F3DC] font-medium mb-1">Future Value</p>
          <p className="text-xl font-extrabold">{fmt(final?.grown || 0)}</p>
        </div>
        <div className="bg-[#F4EFE6] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Total Contributed</p>
          <p className="text-xl font-bold text-[#1B4332]">{fmt(final?.contributed || 0)}</p>
        </div>
        <div className="bg-[#D8F3DC] rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Growth / Returns</p>
          <p className="text-xl font-bold text-[#2D6A4F]">{fmt((final?.grown || 0) - (final?.contributed || 0))}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Growth vs Contributions</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="year" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'years', position: 'insideRight', fontSize: 10 }} />
            <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number, name: string) => [fmt(v), name === 'grown' ? 'With returns' : 'Contributed']} />
            <Line type="monotone" dataKey="contributed" stroke="#D8F3DC" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="grown" stroke="#1B4332" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Affordability Calculator ---
function AffordabilityCalculator() {
  const [income, setIncome] = useState(120000);
  const [expenses, setExpenses] = useState(80000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(22);
  const [years, setYears] = useState(20);

  const disposable = income - expenses;
  const maxEmi = disposable * 0.4;
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const maxLoan = maxEmi * ((1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate);
  const maxPropertyValue = maxLoan / (1 - downPct / 100);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Monthly Net Income (PKR)</label>
          <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Monthly Expenses (PKR)</label>
          <input type="number" value={expenses} onChange={(e) => setExpenses(Number(e.target.value))}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Down Payment (%)</label>
          <input type="number" value={downPct} onChange={(e) => setDownPct(Number(e.target.value))} min={10} max={50}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Loan Term (years)</label>
          <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} min={5} max={30}
            className="w-full border border-[#D8F3DC] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#40916C]" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#F4EFE6] rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Disposable</p>
          <p className="text-base font-bold text-[#1B4332]">{fmt(disposable)}</p>
        </div>
        <div className="bg-[#F4EFE6] rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Max EMI (40%)</p>
          <p className="text-base font-bold text-[#1B4332]">{fmt(maxEmi)}</p>
        </div>
        <div className="bg-[#D8F3DC] rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 font-medium mb-1">Max Loan</p>
          <p className="text-base font-bold text-[#2D6A4F]">{fmt(maxLoan)}</p>
        </div>
        <div className="bg-[#1B4332] rounded-xl p-3 text-center">
          <p className="text-xs text-[#D8F3DC] font-medium mb-1">Affordable Property</p>
          <p className="text-base font-bold text-white">{fmt(maxPropertyValue)}</p>
        </div>
      </div>
    </div>
  );
}

const calcs = [
  { id: 'emi', label: 'Loan / EMI', icon: Car, component: EmiCalculator },
  { id: 'savings', label: 'Savings Growth', icon: TrendingUp, component: SavingsCalculator },
  { id: 'afford', label: 'Home Affordability', icon: Home, component: AffordabilityCalculator },
];

export default function CalculatorsPage() {
  const [active, setActive] = useState('emi');
  const ActiveCalc = calcs.find((c) => c.id === active)!.component;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B4332]">Calculators</h1>
        <p className="text-sm text-[#40916C] mt-1">Financial tools built for Pakistani rupees and real life</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        {calcs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              active === id
                ? 'bg-[#1B4332] text-white shadow-sm'
                : 'bg-white text-[#2D6A4F] border border-[#D8F3DC] hover:bg-[#D8F3DC]'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Calculator Card */}
      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-6">
          <Calculator size={18} className="text-[#40916C]" />
          <h2 className="font-bold text-[#1B4332] text-lg">
            {calcs.find((c) => c.id === active)?.label} Calculator
          </h2>
        </div>
        <ActiveCalc />
      </div>

      {/* Tips */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { title: 'EMI Rule of Thumb', body: 'Keep total EMIs (home + car + personal) below 40% of your net monthly income.' },
          { title: 'The 12% Rule', body: 'Pakistani mutual funds and equity markets have historically returned 12–16% annually. Use 12% for conservative planning.' },
          { title: '20% Down Payment', body: 'Putting 20%+ down on a home reduces your monthly EMI significantly and improves your loan approval chances.' },
        ].map((t) => (
          <div key={t.title} className="bg-[#F4EFE6] rounded-2xl p-4">
            <p className="font-bold text-[#1B4332] text-sm mb-1">{t.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
