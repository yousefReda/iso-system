'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Menu, Moon, Sun, Languages, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AppNotification } from '@/lib/types';
import { useLang } from '@/lib/i18n';
import { NAV_SECTIONS } from './Sidebar';

export default function Header({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, setLang, dir } = useLang();
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

  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const section = allItems.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)));
  const unread = notifs.filter((n) => !n.is_read).length;
  const Chevron = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-surface-border bg-white/90 px-4 backdrop-blur dark:border-navy-600 dark:bg-navy-800/90 md:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-700 md:hidden" aria-label="Menu">
        <Menu className="h-5 w-5" />
      </button>

      <nav aria-label="breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
        <Link href="/dashboard" className="font-semibold text-navy-400 hover:text-navy-600">{t('home')}</Link>
        {section && section.href !== '/dashboard' && (
          <>
            <Chevron className="h-4 w-4 text-navy-300" aria-hidden />
            <span className="font-bold text-navy-700">{t(section.label)}</span>
          </>
        )}
      </nav>

      <form
        className="relative ms-auto w-full max-w-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) router.push(`/clients?q=${encodeURIComponent(q.trim())}`);
        }}
        role="search"
      >
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input ps-9 text-sm"
          placeholder={t('search_client')}
          aria-label={t('search_client')}
        />
      </form>

      {/* تبديل اللغة */}
      <button
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs font-bold text-navy-600 hover:bg-navy-50 dark:border-navy-600 dark:hover:bg-navy-700"
        aria-label={t('toggle_lang')}
        title={t('toggle_lang')}
      >
        <Languages className="h-4 w-4" />
        {t('toggle_lang')}
      </button>

      <button onClick={toggleDark} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-700" aria-label={t('toggle_dark')}>
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpenNotifs((v) => !v)}
          className="relative rounded-lg p-2 text-navy-500 hover:bg-navy-50 dark:hover:bg-navy-700"
          aria-label={`${t('notifications')}${unread ? ` (${unread})` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-red px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
        {openNotifs && (
          <div className="absolute end-0 top-11 w-80 animate-fade-up card p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-bold text-navy-700">{t('notifications')}</p>
              <button onClick={markAllRead} className="text-xs font-semibold text-navy-400 hover:text-navy-600">{t('mark_all_read')}</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 && <p className="px-2 py-6 text-center text-sm text-navy-400">{t('no_notifications')}</p>}
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
                    <p className="text-sm font-bold text-navy-700">{n.title_ar}</p>
                  </div>
                  {n.body_ar && <p className="ms-4 mt-0.5 text-xs text-navy-400">{n.body_ar}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
