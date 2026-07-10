'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, AlertTriangle, Bot } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatPanel from '@/components/chat/ChatPanel';

const MOBILE_NAV = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/clients', label: 'العملاء', icon: Users },
  { href: '/forms', label: 'النماذج', icon: FileText },
  { href: '/nc-tracker', label: 'NC', icon: AlertTriangle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:mr-[260px]">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="p-4 pb-24 md:p-6 md:pb-8">{children}</main>
      </div>

      {/* زر المساعد الذكي العائم — أسفل يسار (RTL) */}
      <button
        onClick={() => setChatOpen(true)}
        className="no-print fixed bottom-20 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy-900 shadow-card-hover hover:scale-105 md:bottom-6 md:left-6"
        aria-label="فتح المساعد الذكي"
      >
        <Bot className="h-7 w-7" />
      </button>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* شريط تنقل سفلي للموبايل */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-white dark:border-navy-700 dark:bg-navy-800 md:hidden" aria-label="تنقل سفلي">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${active ? 'text-navy-700 dark:text-gold' : 'text-navy-300'}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
