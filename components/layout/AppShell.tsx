'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, AlertTriangle, Bot } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatPanel from '@/components/chat/ChatPanel';
import { useLang } from '@/lib/i18n';

const MOBILE_NAV = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'clients', icon: Users },
  { href: '/forms', label: 'forms', icon: FileText },
  { href: '/nc-tracker', label: 'nc_tracker', icon: AlertTriangle },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="md:ms-[264px]">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="p-4 pb-24 md:p-6 md:pb-8">{children}</main>
      </div>

      {/* زر المساعد الذكي العائم */}
      <button
        onClick={() => setChatOpen(true)}
        className="no-print fixed bottom-20 end-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy-900 shadow-card-hover hover:scale-105 md:bottom-6 md:end-6"
        aria-label={t('ai_open')}
      >
        <Bot className="h-7 w-7" />
      </button>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* شريط تنقل سفلي للموبايل */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-surface-border bg-white dark:border-navy-600 dark:bg-navy-800 md:hidden" aria-label="bottom navigation">
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold ${active ? 'text-navy-700 dark:text-gold' : 'text-navy-300'}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {t(label)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
