import Link from 'next/link';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Stethoscope,
  Calculator,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Star,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Smart Dashboard',
    desc: 'Your financial health at a glance. IMR score, net worth snapshot, and monthly pulse — all in one place.',
    color: 'bg-[#D8F3DC] text-[#1B4332]',
  },
  {
    icon: ArrowLeftRight,
    title: 'Money Flow',
    desc: 'See exactly where every rupee goes. Visualize income → needs → wants → savings in real time.',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    icon: PiggyBank,
    title: 'Savings Pots',
    desc: 'Purpose-driven savings jars for every goal: Emergency fund, Eid shopping, vacation, or a new phone.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: Target,
    title: 'Goals Tracker',
    desc: 'Turn dreams into milestones. Track progress toward your house, car, hajj fund, or education.',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    icon: Stethoscope,
    title: 'Spending Autopsy',
    desc: 'Dissect your spending habits. Find where money leaks, spot patterns, and course-correct fast.',
    color: 'bg-red-50 text-red-600',
  },
  {
    icon: Calculator,
    title: 'Calculators',
    desc: 'Loan EMI, savings growth, investment returns — all calculators you actually need, built for PKR.',
    color: 'bg-teal-50 text-teal-700',
  },
];

const benefits = [
  'Built for Pakistani salaries and lifestyle',
  'PKR (₨) currency throughout — no conversions',
  'Intentional Money Rate (IMR) score',
  '100% private — no data leaves your device',
  'Works on mobile and desktop',
  'No bank linking required',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4EFE6]">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-[#F4EFE6]/90 backdrop-blur-sm border-b border-[#E2D9CC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">₨</span>
            </div>
            <span className="font-bold text-[#1B4332] text-xl tracking-tight">PaisaOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[#2D6A4F] hover:text-[#1B4332] transition-colors">Features</a>
            <a href="#why" className="text-sm font-medium text-[#2D6A4F] hover:text-[#1B4332] transition-colors">Why PaisaOS</a>
          </nav>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#2D6A4F] transition-colors shadow-sm"
          >
            Open App <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D8F3DC] text-[#1B4332] px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-[#74C69D]/40">
            <Star size={13} className="fill-[#1B4332]" />
            Built for Pakistan · PKR-first · Free to use
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B4332] leading-tight tracking-tight mb-6">
            Stop managing money
            <br />
            <span className="text-[#40916C]">unconsciously.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#2D6A4F] max-w-2xl mx-auto mb-10 leading-relaxed">
            PaisaOS brings your income, spending, goals, investments, and net worth together in one
            intelligent dashboard. Make every rupee count.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#2D6A4F] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start for Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#1B4332] px-8 py-4 rounded-2xl text-base font-semibold hover:bg-[#D8F3DC] transition-all border border-[#D8F3DC] shadow-sm"
            >
              See Features
            </a>
          </div>
        </div>

        {/* Hero Card Preview */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-[#E8F4ED]">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Monthly Income', value: '₨ 1,20,000', sub: 'This month', color: 'text-[#1B4332]' },
                { label: 'IMR Score', value: '73%', sub: 'Intentional', color: 'text-[#2D6A4F]' },
                { label: 'Net Worth', value: '₨ 8.4L', sub: '+12% YoY', color: 'text-[#40916C]' },
                { label: 'Savings Rate', value: '28%', sub: 'of income', color: 'text-[#1B4332]' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#F4EFE6] rounded-2xl p-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
            {/* Fake progress bars */}
            <div className="space-y-3">
              {[
                { label: 'Needs (50%)', pct: 50, color: 'bg-[#1B4332]' },
                { label: 'Wants (22%)', pct: 22, color: 'bg-[#40916C]' },
                { label: 'Savings (28%)', pct: 28, color: 'bg-[#74C69D]' },
              ].map((bar) => (
                <div key={bar.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 font-medium">{bar.label}</span>
                  <div className="flex-1 h-2.5 bg-[#F4EFE6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B4332] mb-4">
            Everything you need to master money
          </h2>
          <p className="text-lg text-[#2D6A4F] max-w-xl mx-auto">
            Seven powerful tools working together to give you complete financial clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 cursor-default border border-[#F4EFE6]"
            >
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-[#1B4332] text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why PaisaOS */}
      <section id="why" className="bg-[#1B4332] py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Built for how Pakistanis actually live
              </h2>
              <p className="text-[#74C69D] text-lg mb-8 leading-relaxed">
                Most finance apps are built for Western economies. PaisaOS understands Pakistani salaries,
                expenses, family commitments, and savings culture.
              </p>
              <div className="space-y-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#74C69D] flex-shrink-0" />
                    <span className="text-[#D8F3DC] text-sm font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* IMR Explainer Card */}
            <div className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
              <div className="mb-6">
                <p className="text-[#74C69D] text-sm font-semibold uppercase tracking-wider mb-2">
                  Introducing
                </p>
                <h3 className="text-white text-2xl font-extrabold">
                  Intentional Money Rate
                </h3>
                <p className="text-[#D8F3DC] text-sm mt-2 leading-relaxed">
                  Your IMR score tells you what percentage of your spending was a conscious choice vs.
                  money that slipped away without you noticing.
                </p>
              </div>
              {/* IMR gauge simulation */}
              <div className="bg-white/10 rounded-2xl p-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-[#D8F3DC] text-xs font-medium">Your IMR Score</p>
                    <p className="text-white text-4xl font-extrabold">73%</p>
                  </div>
                  <span className="bg-[#74C69D]/20 text-[#74C69D] px-3 py-1 rounded-full text-sm font-semibold">
                    Good
                  </span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[73%] bg-gradient-to-r from-[#74C69D] to-[#40916C] rounded-full" />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[#D8F3DC]/60 text-xs">0%</span>
                  <span className="text-[#74C69D] text-xs font-medium">Goal: 80%</span>
                  <span className="text-[#D8F3DC]/60 text-xs">100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1B4332] mb-4">
          Ready to take control?
        </h2>
        <p className="text-lg text-[#2D6A4F] mb-10 max-w-lg mx-auto">
          Join thousands of Pakistanis making smarter money decisions with PaisaOS.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-10 py-4 rounded-2xl text-base font-bold hover:bg-[#2D6A4F] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Open Your Dashboard
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2D9CC] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1B4332] flex items-center justify-center">
              <span className="text-white font-bold text-xs">₨</span>
            </div>
            <span className="font-bold text-[#1B4332]">PaisaOS</span>
          </div>
          <p className="text-sm text-gray-400">© 2024 PaisaOS. Your financial OS, built for Pakistan.</p>
        </div>
      </footer>
    </div>
  );
}
