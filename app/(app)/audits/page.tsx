'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Skeleton, EmptyState } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Audit } from '@/lib/types';

export default function AuditsPage() {
  const { t, tAuditType } = useLang();
  const [audits, setAudits] = useState<Audit[] | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    createClient()
      .from('audits')
      .select('*, clients(id, name, name_ar, client_number, standards), auditors(id, name, color)')
      .order('start_date', { ascending: false })
      .then(({ data }) => setAudits((data as Audit[]) ?? []));
  }, []);

  if (!audits) return <Skeleton className="h-96" />;
  const filtered = audits.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('audits')}</h1>
          <p className="text-sm text-navy-400">{audits.length} {t('audit_ops')}</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-44" aria-label={t('status')}>
          <option value="all">{t('all')}</option>
          <option value="planned">{t('planned')}</option>
          <option value="in_progress">{t('in_progress')}</option>
          <option value="completed">{t('completed')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('no_audits')} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Link key={a.id} href={`/audits/${a.id}`} className="card card-hover p-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${a.status === 'completed' ? 'bg-green-50 text-status-green' : a.status === 'planned' ? 'bg-gold-50 text-gold-600' : 'bg-navy-50 text-navy-600'}`}>
                  {tAuditType(a.audit_type)}
                </span>
                <span className="font-inter text-xs text-navy-400" dir="ltr">{a.start_date}</span>
              </div>
              <p className="mt-2 font-bold text-navy-700">{a.clients?.name}</p>
              <p className="font-inter text-[11px] text-navy-400" dir="ltr">{a.clients?.client_number}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-navy-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.auditors?.color ?? '#2E5FA3' }} aria-hidden />
                {a.auditors?.name ?? '—'}
                <span className="ms-auto">{a.status === 'completed' ? `✓ ${t('completed')}` : a.status === 'planned' ? t('planned') : t('in_progress')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
