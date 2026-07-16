'use client';
import { useEffect, useState } from 'react';
import { Users, ClipboardCheck, AlertTriangle, UserCheck } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { KpiCard, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { ClientStatus, NCStatus } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  active: '#1A7A4A', pending: '#E8A020', suspended: '#C0392B', expired: '#64748B',
  open: '#C0392B', response_received: '#2E5FA3', under_review: '#E8A020', closed: '#1A7A4A',
};

export default function StatisticsPage() {
  const { t, tClientStatus, tNCStatus } = useLang();
  const [totals, setTotals] = useState<{ clients: number; audits: number; ncs: number; auditors: number } | null>(null);
  const [clientsByStatus, setClientsByStatus] = useState<{ key: ClientStatus; value: number }[]>([]);
  const [ncByStatus, setNcByStatus] = useState<{ key: NCStatus; value: number }[]>([]);
  const [workload, setWorkload] = useState<{ name: string; bookings: number; color: string }[]>([]);
  const [standardsDist, setStandardsDist] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const [clients, audits, ncs, auditors, planning] = await Promise.all([
        supabase.from('clients').select('status, standards'),
        supabase.from('audits').select('id', { count: 'exact', head: true }),
        supabase.from('non_conformities').select('status'),
        supabase.from('auditors').select('id, name, color').eq('is_active', true),
        supabase.from('auditor_planning').select('auditor_id'),
      ]);

      setTotals({
        clients: clients.data?.length ?? 0,
        audits: audits.count ?? 0,
        ncs: ncs.data?.length ?? 0,
        auditors: auditors.data?.length ?? 0,
      });

      const cs: Record<string, number> = {};
      const dist: Record<string, number> = {};
      (clients.data ?? []).forEach((c: { status: string; standards: string[] }) => {
        cs[c.status] = (cs[c.status] ?? 0) + 1;
        (c.standards ?? []).forEach((s) => (dist[s] = (dist[s] ?? 0) + 1));
      });
      setClientsByStatus(Object.entries(cs).map(([key, value]) => ({ key: key as ClientStatus, value })));
      setStandardsDist(Object.entries(dist).map(([name, value]) => ({ name, value })));

      const ns: Record<string, number> = {};
      (ncs.data ?? []).forEach((n: { status: string }) => (ns[n.status] = (ns[n.status] ?? 0) + 1));
      setNcByStatus(Object.entries(ns).map(([key, value]) => ({ key: key as NCStatus, value })));

      const wl: Record<string, number> = {};
      (planning.data ?? []).forEach((p: { auditor_id: string }) => (wl[p.auditor_id] = (wl[p.auditor_id] ?? 0) + 1));
      setWorkload(
        (auditors.data ?? [])
          .map((a: { id: string; name: string; color: string }) => ({ name: a.name.split(' ')[0], bookings: wl[a.id] ?? 0, color: a.color }))
          .filter((x) => x.bookings > 0)
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 10)
      );
    })();
  }, []);

  if (!totals) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('statistics')}</h1>
        <p className="text-sm text-navy-400">{t('stats_sub')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Users className="h-6 w-6" />} label={t('total_clients')} value={totals.clients} color="navy" />
        <KpiCard icon={<ClipboardCheck className="h-6 w-6" />} label={t('total_audits')} value={totals.audits} color="gold" />
        <KpiCard icon={<AlertTriangle className="h-6 w-6" />} label={t('total_ncs')} value={totals.ncs} color="red" />
        <KpiCard icon={<UserCheck className="h-6 w-6" />} label={t('total_auditors')} value={totals.auditors} color="green" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-4 font-bold text-navy-700">{t('clients_by_status')}</h2>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientsByStatus.map((d) => ({ name: tClientStatus(d.key), value: d.value, key: d.key }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {clientsByStatus.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-navy-700">{t('nc_by_status')}</h2>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ncByStatus.map((d) => ({ name: tNCStatus(d.key), value: d.value, key: d.key }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {ncByStatus.map((d) => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-bold text-navy-700">{t('standards_dist')}</h2>
          <div className="h-60" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={standardsDist} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#2E5FA3" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-bold text-navy-700">{t('auditor_workload')}</h2>
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {workload.map((w, i) => <Cell key={i} fill={w.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
