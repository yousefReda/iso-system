'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Modal, Skeleton, EmptyState } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Audit, Client } from '@/lib/types';

const MILESTONE_ORDER: Audit['audit_type'][] = ['Stage1', 'Stage2', 'SUR1', 'SUR2', 'RC'];
const MILESTONE_COLOR: Record<string, string> = {
  Stage1: '#2E5FA3', Stage2: '#1B3A6B', SUR1: '#E8A020', SUR2: '#C9871A', RC: '#1A7A4A',
};

export default function AuditProgramPage() {
  const { t, tAuditType, lang } = useLang();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selected, setSelected] = useState<Audit | null>(null);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('audits').select('*, auditors(id, name, color), clients(id, name, name_ar, client_number, standards)').not('start_date', 'is', null),
    ]).then(([c, a]) => {
      setClients((c.data as Client[]) ?? []);
      setAudits((a.data as Audit[]) ?? []);
    });
  }, []);

  // النطاق الزمني: 3 سنوات من أول تدقيق
  const { minTime, span } = useMemo(() => {
    const times = audits.map((a) => new Date(a.start_date!).getTime());
    const min = times.length ? Math.min(...times) : Date.now();
    const start = new Date(min);
    start.setMonth(0, 1);
    return { minTime: start.getTime(), span: 3.2 * 365 * 864e5 };
  }, [audits]);

  const years = useMemo(() => {
    const y0 = new Date(minTime).getFullYear();
    return [y0, y0 + 1, y0 + 2, y0 + 3];
  }, [minTime]);

  function pos(date: string) {
    return Math.min(98, Math.max(0, ((new Date(date).getTime() - minTime) / span) * 100));
  }

  if (!clients) return <Skeleton className="h-96" />;

  const withAudits = clients.filter((c) => audits.some((a) => a.client_id === c.id));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{lang === 'ar' ? 'برنامج التدقيق' : 'Audit Program'}</h1>
        <p className="text-sm text-navy-400">{lang === 'ar' ? 'دورة الاعتماد الكاملة (3 سنوات) لكل عميل — اضغط على أي محطة للتفاصيل' : 'Full 3-year certification cycle per client — click any milestone for details'}</p>
      </div>

      {/* Legend */}
      <div className="card flex flex-wrap items-center gap-4 p-3 text-xs font-semibold">
        {MILESTONE_ORDER.map((m) => (
          <span key={m} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full" style={{ background: MILESTONE_COLOR[m] }} aria-hidden />
            {tAuditType(m)}
          </span>
        ))}
      </div>

      {withAudits.length === 0 && <EmptyState title={lang === 'ar' ? 'لا برامج تدقيق بعد' : 'No audit programs yet'} hint={lang === 'ar' ? 'أضف عميلاً وخطط تدقيقاته لعرض البرنامج الزمني' : 'Add a client and plan its audits to see the timeline'} />}

      <div className="space-y-4">
        {withAudits.map((client) => {
          const clientAudits = audits
            .filter((a) => a.client_id === client.id)
            .sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1));
          return (
            <div key={client.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Link href={`/clients/${client.id}`} className="font-bold text-navy-700 hover:text-gold-600 dark:text-white">
                  {client.name}
                </Link>
                <span className="font-inter text-xs text-navy-400" dir="ltr">{client.client_number}</span>
              </div>

              {/* الخط الزمني الأفقي */}
              <div className="relative overflow-x-auto pb-2" dir="ltr">
                <div className="relative h-20 min-w-[600px]">
                  {/* خط السنوات */}
                  <div className="absolute inset-x-0 top-8 h-1 rounded-full bg-navy-100 dark:bg-navy-700" />
                  {years.map((y, i) => (
                    <span key={y} className="absolute top-12 -translate-x-1/2 font-inter text-[10px] font-bold text-navy-300" style={{ left: `${(i / 3.2) * 100}%` }}>
                      {y}
                    </span>
                  ))}
                  {clientAudits.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="group absolute top-4 -translate-x-1/2"
                      style={{ left: `${pos(a.start_date!)}%` }}
                      aria-label={`${tAuditType(a.audit_type)} — ${a.start_date}`}
                    >
                      <span
                        className={`block h-9 w-9 rounded-full border-4 border-white shadow-card transition-transform group-hover:scale-125 dark:border-navy-800 ${a.status === 'completed' ? '' : 'ring-2 ring-gold/60'}`}
                        style={{ background: MILESTONE_COLOR[a.audit_type] }}
                      />
                      <span className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-navy-500 opacity-0 group-hover:opacity-100">
                        {a.audit_type} · {a.start_date}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal التفاصيل */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${tAuditType(selected.audit_type)} — ${selected.clients?.name ?? ''}` : ''}>
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-gray p-3 dark:bg-navy-900"><p className="text-xs text-navy-400">{t('date')}</p><p className="font-inter font-bold text-navy-700 dark:text-white" dir="ltr">{selected.start_date}{selected.end_date && selected.end_date !== selected.start_date ? ` → ${selected.end_date}` : ''}</p></div>
              <div className="rounded-lg bg-surface-gray p-3 dark:bg-navy-900"><p className="text-xs text-navy-400">{t('status')}</p><p className="font-bold text-navy-700 dark:text-white">{selected.status === 'completed' ? `${t('completed')} ✓` : t('planned')}</p></div>
            </div>
            <div className="rounded-lg bg-surface-gray p-3 dark:bg-navy-900">
              <p className="text-xs text-navy-400">{t('lead_auditor')}</p>
              <p className="flex items-center gap-2 font-bold text-navy-700 dark:text-white">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: selected.auditors?.color ?? '#2E5FA3' }} aria-hidden />
                {selected.auditors?.name ?? '—'}
              </p>
              {selected.team.length > 0 && <p className="mt-1 text-xs text-navy-400">{t('audit_team')}: {selected.team.join(', ')}</p>}
            </div>
            {selected.summary && <p className="rounded-lg bg-gold-50 p-3 text-navy-700 dark:bg-navy-700 dark:text-slate-100">{selected.summary}</p>}
            <Link href={`/audits/${selected.id}`} className="btn-primary w-full">{lang === 'ar' ? 'فتح صفحة التدقيق' : 'Open audit page'}</Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
