'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, User as UserIcon, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

export function Navbar(): React.ReactElement | null {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Do not show Navbar if user is not authenticated
  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/trips/create', label: 'Create Trip', icon: PlusCircle },
    { href: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex flex-shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-xl tracking-tight text-zinc-950">
              <Compass className="h-6 w-6 text-indigo-600 animate-pulse" />
              <span>Wayfarer<span className="text-indigo-600">.ai</span></span>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-zinc-50 text-indigo-600"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Profile / Logout */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-zinc-950">{user.name}</span>
              <span className="text-xs text-zinc-400">{user.email}</span>
            </div>
            
            <button
              onClick={() => void logout()}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
