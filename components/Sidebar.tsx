'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, Target,
  Stethoscope, Calculator, TrendingUp, Menu, X, UserCircle, LogOut, Wallet,
  Fuel, ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/components/AuthProvider';
import SyncIndicator from '@/components/SyncIndicator';

const navItems = [
  { href: '/dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/wallet',           label: 'Wallet',            icon: Wallet          },
  { href: '/money-flow',       label: 'Money Flow',        icon: ArrowLeftRight  },
  { href: '/savings-pots',     label: 'Savings Pots',      icon: PiggyBank       },
  { href: '/goals',            label: 'Goals',             icon: Target          },
  { href: '/spending-autopsy', label: 'Spending Autopsy',  icon: Stethoscope     },
  { href: '/calculators',      label: 'Calculators',       icon: Calculator      },
  { href: '/net-worth',        label: 'Net Worth',         icon: TrendingUp      },
  { href: '/petrol',           label: 'Petrol Tracker',    icon: Fuel            },
  { href: '/backup',           label: 'Cloud Backup',      icon: ShieldCheck     },
  { href: '/account',          label: 'Account',           icon: UserCircle      },
];

export default function Sidebar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { name, clearIdentity } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => {
    clearIdentity();
    router.replace('/login');
  };

  const NavContent = () => (
    <>
      <div className="px-6 py-6 border-b border-[#D8F3DC]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-[#1B4332] flex items-center justify-center shadow-sm group-hover:bg-[#2D6A4F] transition-colors">
            <span className="text-white font-bold text-sm">₨</span>
          </div>
          <div>
            <p className="font-bold text-[#1B4332] text-lg leading-tight tracking-tight">PaisaOS</p>
            <p className="text-xs text-[#40916C] font-medium">Personal Finance</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-[#1B4332] text-white shadow-sm'
                  : 'text-[#2D6A4F] hover:bg-[#D8F3DC] hover:text-[#1B4332]'
              )}
            >
              <Icon size={18} className={clsx('flex-shrink-0', active ? 'text-[#74C69D]' : 'text-[#40916C]')} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-[#D8F3DC] space-y-2">
        {name && (
          <div className="flex items-center gap-3 px-1 mb-1">
            <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
              <span className="text-[#1B4332] font-bold text-xs">{name.slice(0, 2).toUpperCase()}</span>
            </div>
            <p className="text-sm font-semibold text-[#1B4332] truncate">{name}</p>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <SyncIndicator />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-[#E8F4ED] fixed top-0 left-0 z-30">
        <NavContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E8F4ED] px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] flex items-center justify-center">
            <span className="text-white font-bold text-sm">₨</span>
          </div>
          <span className="font-bold text-[#1B4332] text-lg">PaisaOS</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-[#D8F3DC] text-[#1B4332] transition-colors">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 left-0 h-full w-72 bg-white flex flex-col shadow-2xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}
