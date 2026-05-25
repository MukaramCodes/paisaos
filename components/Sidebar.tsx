'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Stethoscope,
  Calculator,
  TrendingUp,
  Menu,
  X,
  Pencil,
  Check,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuth } from '@/components/AuthProvider';
import SyncIndicator from '@/components/SyncIndicator';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/money-flow', label: 'Money Flow', icon: ArrowLeftRight },
  { href: '/savings-pots', label: 'Savings Pots', icon: PiggyBank },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/spending-autopsy', label: 'Spending Autopsy', icon: Stethoscope },
  { href: '/calculators', label: 'Calculators', icon: Calculator },
  { href: '/net-worth', label: 'Net Worth', icon: TrendingUp },
  { href: '/account', label: 'Account', icon: UserCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('paisaos_username');
    if (saved) setUserName(saved);
  }, []);

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setUserName(trimmed);
      localStorage.setItem('paisaos_username', trimmed);
    }
    setEditingName(false);
  };

  const startEdit = () => {
    setNameInput(userName);
    setEditingName(true);
  };

  const NavContent = () => (
    <>
      {/* Brand */}
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

      {/* Nav Links */}
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

      {/* Account Footer */}
      <div className="px-4 py-4 border-t border-[#D8F3DC] space-y-2">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              placeholder="Enter your name"
              className="flex-1 text-sm border border-[#D8F3DC] rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#40916C] bg-[#F4EFE6]"
            />
            <button onClick={saveName} className="p-1.5 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D6A4F]">
              <Check size={13} />
            </button>
          </div>
        ) : userName ? (
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                <span className="text-[#1B4332] font-bold text-xs">
                  {userName.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1B4332] truncate">{userName}</p>
                {user?.email && (
                  <p className="text-xs text-[#40916C] truncate">{user.email}</p>
                )}
              </div>
            </div>
            <button onClick={startEdit} className="p-1 text-gray-300 hover:text-[#40916C] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
              <Pencil size={13} />
            </button>
          </div>
        ) : (
          <div>
            {user?.email && (
              <p className="text-xs text-[#40916C] mb-2 truncate">{user.email}</p>
            )}
            <button
              onClick={startEdit}
              className="w-full text-sm text-[#40916C] border border-dashed border-[#D8F3DC] rounded-xl py-2 hover:bg-[#D8F3DC]/40 transition-colors font-medium"
            >
              + Set your name
            </button>
          </div>
        )}
        <div className="flex items-center justify-between px-1">
          <SyncIndicator />
          <button
            onClick={signOut}
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-white border-r border-[#E8F4ED] fixed top-0 left-0 z-30">
        <NavContent />
      </aside>

      {/* Mobile Header */}
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

      {/* Mobile Drawer */}
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
