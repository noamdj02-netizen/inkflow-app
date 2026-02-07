'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  CheckSquare,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: Home, label: 'Accueil' },
  { href: '/dashboard/calendar', icon: Calendar, label: 'Calendrier' },
  { href: '/dashboard/requests', icon: CheckSquare, label: 'Demandes' },
  { href: '/dashboard/flashs', icon: MessageSquare, label: 'Flashs' },
] as const;

export function CalendarIconSidebar() {
  const pathname = usePathname();
  const isCalendar = pathname?.startsWith('/dashboard/calendar');

  return (
    <aside
      className="w-[80px] flex-shrink-0 flex flex-col items-center py-6 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[calc(100vh-2rem)]"
      style={{ boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}
    >
      <nav className="flex flex-col items-center gap-2 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === '/dashboard/calendar' ? isCalendar : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center transition-colors',
                active
                  ? 'bg-[#6366f1] text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              )}
            >
              <Icon size={22} strokeWidth={1.8} />
            </Link>
          );
        })}
      </nav>
      <div className="pt-4 border-t border-gray-100">
        <Link
          href="/dashboard/settings"
          aria-label="Paramètres"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Settings size={22} strokeWidth={1.8} />
        </Link>
      </div>
    </aside>
  );
}
