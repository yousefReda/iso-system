'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, Moon, Sun, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AppNotification } from '@/lib/types';
import { NAV_ITEMS } from './Sidebar';

export default function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [openNotifs, setOpenNotifs] = useState(false);
  const [dark, setDark] = useState(false);
  const [q, setQ] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    createClient()
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setNotifs((data as AppNotification[]) ?? []));
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpenNotifs(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.theme = next ? 'dark' : 'light'; } catch {}
  }

  async function markAllRead() {
    setNotifs((n) => n.map((x) => ({ ...x, is_read: true })));
    await createClient().from('notifications').update({ is_read: true }).eq('is_read', false);
  }

  const section = NAV_ITEMS.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)));
  const unread = notifs.filter((n) => !n.is_read).length;

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-border bg-white/90 px-4 backdrop-blur dark:border-navy-700 dark:bg-navy-800/90 md:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 md:hidden" aria-label="فتح القائمة">
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="مسار التنقل" className="hidden items-center gap-1 text-sm md:flex">
        <Link href="/dashboard" className="font-semibold text-navy-400 hover:text-navy-600">الرئيسية</Link>
        {section && section.href !== '/dashboard' && (
          <>
            <ChevronLeft className="h-4 w-4 text-navy-300" aria-hidden />
            <span className="font-bold text-navy-700 dark:text-white">{section.label}</span>
          </>
        )}
      </nav>

      <form
        className="relative mr-auto w-full max-w-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/clients?q=${encodeURIComponent(q.trim())}`);
        }}
        role="search"
      >
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input pr-9 text-sm"
          placeholder="بحث عن عميل..."
          aria-label="بحث عن عميل"
        />
      </form>

      <button onClick={toggleDark} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 dark:text-slate-300 dark:hover:bg-navy-700" aria-label="تبديل الوضع الليلي">
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpenNotifs((v) => !v)}
          className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-50 dark:text-slate-300 dark:hover:bg-navy-700"
          aria-label={`الإشعارات${unread ? ` (${unread} غير مقروء)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {openNotifs && (
          <div className="absolute left-0 top-11 w-80 animate-fade-up card p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-bold text-navy-700 dark:text-white">الإشعارات</p>
              <button onClick={markAllRead} className="text-xs font-semibold text-navy-400 hover:text-navy-600">تحديد الكل كمقروء</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 && <p className="px-2 py-6 text-center text-sm text-navy-400">لا إشعارات</p>}
              {notifs.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? '#'}
                  onClick={() => setOpenNotifs(false)}
                  className={`block rounded-lg px-3 py-2 hover:bg-navy-50 dark:hover:bg-navy-700 ${n.is_read ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        n.kind === 'danger' ? 'bg-status-red' : n.kind === 'warning' ? 'bg-status-amber' : n.kind === 'success' ? 'bg-status-green' : 'bg-navy-400'
                      }`}
                      aria-hidden
                    />
                    <p className="text-sm font-bold text-navy-700 dark:text-slate-100">{n.title_ar}</p>
                  </div>
                  {n.body_ar && <p className="mr-4 mt-0.5 text-xs text-navy-400">{n.body_ar}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
