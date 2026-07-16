'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, CalendarClock, AlertTriangle, BadgeAlert, Plus, Calculator, FileText } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { KpiCard, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { ActivityItem, Audit } from '@/lib/types';

const PIE_COLORS = ['#1B3A6B', '#2E5FA3', '#E8A020', '#1A7A4A', '#C0392B', '#7C3AED'];
const MONTHS: Record<'en' | 'ar', string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

interface Kpis { active: number; upcoming: number; openNcs: number; expiring: number; }

export default function DashboardPage() {
  const { t, lang, tAuditType } = useLang();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [auditsByMonth, setAuditsByMonth] = useState<{ m: number; audits: number }[]>([]);
  const [standardsDist, setStandardsDist] = useState<{ name: string; value: number }[]>([]);
  const [ncByMonth, setNcByMonth] = useState<{ m: number; nc: number }[]>([]);
  const [upcomingAudits, setUpcomingAudits] = useState<Audit[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const in90 = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

    (async () => {
      const [active, upcoming, openNcs, expiring, clients, audits, ncs, upcomingList, act] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('audits').select('id', { count: 'exact', head: true }).eq('status', 'planned').gte('start_date', today),
        supabase.from('non_conformities').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
        supabase.from('clients').select('id', { count: 'exact', head: true }).gte('cert_expiry_date', today).lte('cert_expiry_date', in90),
        supabase.from('clients').select('standards'),
        supabase.from('audits').select('start_date').not('start_date', 'is', null),
        supabase.from('non_conformities').select('created_at'),
        supabase.from('audits').select('*, clients(id, name, name_ar, client_number, standards), auditors(id, name, color)').eq('status', 'planned').gte('start_date', today).order('start_date').limit(6),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
      ]);

      setKpis({ active: active.count ?? 0, upcoming: upcoming.count ?? 0, openNcs: openNcs.count ?? 0, expiring: expiring.count ?? 0 });

      const dist: Record<string, number> = {};
      (clients.data ?? []).forEach((c: { standards: string[] }) => (c.standards ?? []).forEach((s) => (dist[s] = (dist[s] ?? 0) + 1)));
      setStandardsDist(Object.entries(dist).map(([name, value]) => ({ name, value })));

      const byMonth: Record<string, number> = {};
      const ncMonth: Record<string, number> = {};
      const now = new Date();
      const keys: string[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        keys.push(k);
        byMonth[k] = 0;
        ncMonth[k] = 0;
      }
      (audits.data ?? []).forEach((a: { start_date: string }) => {
        const k = a.start_date?.slice(0, 7);
        if (k in byMonth) byMonth[k]++;
      });
      (ncs.data ?? []).forEach((n: { created_at: string }) => {
        const k = n.created_at?.slice(0, 7);
        if (k in ncMonth) ncMonth[k]++;
      });
      setAuditsByMonth(keys.map((k) => ({ m: Number(k.slice(5)) - 1, audits: byMonth[k] })));
      setNcByMonth(keys.map((k) => ({ m: Number(k.slice(5)) - 1, nc: ncMonth[k] })));
      setUpcomingAudits((upcomingList.data as Audit[]) ?? []);
      setActivity((act.data as ActivityItem[]) ?? []);
    })();
  }, []);

  const months = MONTHS[lang];
  const lineData = auditsByMonth.map((d) => ({ name: months[d.m], audits: d.audits }));
  const barData = ncByMonth.map((d) => ({ name: months[d.m], nc: d.nc }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('dashboard')}</h1>
          <p className="text-sm text-navy-400">{t('dash_sub')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients/new" className="btn-gold"><Plus className="h-4 w-4" /> {t('new_client')}</Link>
          <Link href="/calculator" className="btn-outline"><Calculator className="h-4 w-4" /> {t('calculator')}</Link>
          <Link href="/forms" className="btn-outline hidden sm:inline-flex"><FileText className="h-4 w-4" /> {t('forms')}</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis ? (
          <>
            <KpiCard icon={<Users className="h-6 w-6" />} label={t('active_clients')} value={kpis.active} color="navy" trend={{ dir: 'up', text: t('valid_certs') }} />
            <KpiCard icon={<CalendarClock className="h-6 w-6" />} label={t('upcoming_audits')} value={kpis.upcoming} color="gold" />
            <KpiCard icon={<AlertTriangle className="h-6 w-6" />} label={t('open_ncs')} value={kpis.openNcs} color="red" trend={kpis.openNcs > 0 ? { dir: 'down', text: t('needs_follow') } : undefined} />
            <KpiCard icon={<BadgeAlert className="h-6 w-6" />} label={t('expiring_90')} value={kpis.expiring} color="green" />
          </>
        ) : (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-bold text-navy-700">{t('monthly_audits')}</h2>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="audits" name={t('audits')} stroke="#1B3A6B" strokeWidth={2.5} dot={{ fill: '#E8A020', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-navy-700">{t('standards_dist')}</h2>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={standardsDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {standardsDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-bold text-navy-700">{t('upcoming_audits_tbl')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-start text-xs text-navy-400 dark:border-navy-600">
                  <th className="pb-2 pe-2 text-start font-semibold">{t('client')}</th>
                  <th className="pb-2 pe-2 text-start font-semibold">{t('type')}</th>
                  <th className="pb-2 pe-2 text-start font-semibold">{t('date')}</th>
                  <th className="pb-2 pe-2 text-start font-semibold">{t('lead_auditor')}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAudits.map((a) => (
                  <tr key={a.id} className="border-b border-surface-border/60 last:border-0 hover:bg-navy-50/50 dark:border-navy-600 dark:hover:bg-navy-700/40">
                    <td className="py-2.5 pe-2">
                      <Link href={`/audits/${a.id}`} className="font-semibold text-navy-700 hover:text-gold-600">
                        {a.clients?.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pe-2">
                      <span className="rounded bg-navy-50 px-2 py-0.5 text-xs font-bold text-navy-600 dark:bg-navy-700 dark:text-navy-100">
                        {tAuditType(a.audit_type)}
                      </span>
                    </td>
                    <td className="py-2.5 pe-2 font-inter text-xs" dir="ltr">{a.start_date}</td>
                    <td className="py-2.5 pe-2 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.auditors?.color ?? '#2E5FA3' }} aria-hidden />
                        {a.auditors?.name ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcomingAudits.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-navy-400">{t('no_upcoming')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-navy-700">{t('recent_activity')}</h2>
          <ol className="relative space-y-4 border-s-2 border-surface-border ps-4 dark:border-navy-600">
            {activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-gold-50 dark:ring-navy-800" aria-hidden />
                <p className="text-sm font-semibold leading-snug text-navy-700">{a.description_ar}</p>
                <p className="mt-0.5 text-[11px] text-navy-400">
                  {a.actor} · <span dir="ltr" className="font-inter">{new Date(a.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-bold text-navy-700">{t('monthly_ncs')}</h2>
        <div className="h-52" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="nc" name="NC" fill="#C0392B" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
