'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calculator, CalendarRange, ClipboardCheck,
  FileText, AlertTriangle, UserCheck, Settings, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/clients', label: 'العملاء', icon: Users },
  { href: '/calculator', label: 'حاسبة الأيام', icon: Calculator },
  { href: '/audit-program', label: 'برنامج التدقيق', icon: CalendarRange },
  { href: '/audits', label: 'التدقيقات', icon: ClipboardCheck },
  { href: '/forms', label: 'النماذج', icon: FileText },
  { href: '/nc-tracker', label: 'عدم المطابقة', icon: AlertTriangle },
  { href: '/auditors', label: 'المدققون', icon: UserCheck },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {mobileOpen && <div className="no-print fixed inset-0 z-30 bg-navy-900/40 md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`no-print fixed inset-y-0 right-0 z-40 flex w-[260px] flex-col border-l border-surface-border bg-white dark:border-navy-700 dark:bg-navy-800 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0`}
        aria-label="القائمة الرئيسية"
      >
        <div className="flex items-center gap-3 border-b border-surface-border px-5 py-4 dark:border-navy-700">
          <Image src="/logo.jpg" alt="" width={44} height={44} className="rounded-full" />
          <div>
            <p className="text-sm font-bold leading-tight text-navy-700 dark:text-white">ISO CERT</p>
            <p className="font-inter text-[10px] tracking-wide text-navy-400">INTERNATIONAL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                  active
                    ? 'bg-navy-700 text-white shadow-card'
                    : 'text-navy-500 hover:bg-navy-50 hover:text-navy-700 dark:text-slate-300 dark:hover:bg-navy-700'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
                {label}
                {active && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-surface-border p-3 dark:border-navy-700">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-sm font-bold text-white">م</span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-bold text-navy-700 dark:text-white">مدير النظام</p>
              <p className="font-inter text-[10px] text-navy-400" dir="ltr">admin@isocert.com</p>
            </div>
            <button onClick={signOut} className="rounded-lg p-2 text-navy-400 hover:bg-red-50 hover:text-status-red" title="تسجيل الخروج" aria-label="تسجيل الخروج">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
