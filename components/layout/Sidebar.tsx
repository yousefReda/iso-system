'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Users, FolderOpen, Award, ClipboardCheck,
  AlertTriangle, UserCheck, FolderCog, FileText, Settings, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/i18n';

export const NAV_SECTIONS = [
  {
    label: 'nav_overview',
    items: [
      { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
      { href: '/statistics', label: 'statistics', icon: BarChart3 },
    ],
  },
  {
    label: 'nav_clients_sec',
    items: [
      { href: '/clients', label: 'clients', icon: Users },
      { href: '/audit-files', label: 'audit_files', icon: FolderOpen },
      { href: '/certificates', label: 'certificates', icon: Award },
    ],
  },
  {
    label: 'nav_audits_sec',
    items: [
      { href: '/audits', label: 'audits', icon: ClipboardCheck },
      { href: '/nc-tracker', label: 'nc_tracker', icon: AlertTriangle },
    ],
  },
  {
    label: 'nav_auditors_sec',
    items: [
      { href: '/auditors', label: 'auditors', icon: UserCheck },
      { href: '/auditor-files', label: 'auditor_files', icon: FolderCog },
    ],
  },
  {
    label: 'nav_system_sec',
    items: [
      { href: '/forms', label: 'forms', icon: FileText },
      { href: '/settings', label: 'settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {mobileOpen && <div className="no-print fixed inset-0 z-30 bg-navy-900/60 md:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={`no-print fixed inset-y-0 start-0 z-40 w-[264px] flex-col bg-gradient-to-b from-navy-800 to-navy-900 text-white shadow-card-hover ${
          mobileOpen ? 'flex' : 'hidden'
        } md:flex`}
        aria-label={t('dashboard')}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <Image src="/logo.jpg" alt="" width={46} height={46} className="rounded-full ring-2 ring-gold/60" />
          <div>
            <p className="text-sm font-bold leading-tight">ISO CERT</p>
            <p className="font-inter text-[10px] tracking-widest text-gold">INTERNATIONAL</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-200/60">
                {t(section.label)}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold ${
                        active
                          ? 'bg-white/10 text-gold shadow-inner'
                          : 'text-navy-100/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {active && <span className="absolute inset-y-1.5 start-0 w-1 rounded-full bg-gold" aria-hidden />}
                      <Icon className="h-[17px] w-[17px]" aria-hidden />
                      {t(label)}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy-900">A</span>
            <div className="flex-1 leading-tight">
              <p className="text-sm font-bold">{t('system_admin')}</p>
              <p className="font-inter text-[10px] text-navy-200/70" dir="ltr">admin@isocert.com</p>
            </div>
            <button onClick={signOut} className="rounded-lg p-2 text-navy-200/70 hover:bg-white/10 hover:text-red-300" title={t('sign_out')} aria-label={t('sign_out')}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
