'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/core';
import { AuditBadge } from '@/components/ui/badges';
import { useLang } from '@/lib/i18n';
import type { Audit, AuditResult, ResultStatus } from '@/lib/types';

interface PlanItem { id: string; day_no: number; time_from: string | null; time_to: string | null; activity: string; auditor: string | null; department: string | null; }

const DEFAULT_CLAUSES: { clause: string; en: string; ar: string }[] = [
  { clause: '4', en: 'Context of the Organization', ar: 'سياق المنظمة' },
  { clause: '5', en: 'Leadership', ar: 'القيادة' },
  { clause: '6', en: 'Planning', ar: 'التخطيط' },
  { clause: '7', en: 'Support', ar: 'الدعم' },
  { clause: '8', en: 'Operation', ar: 'التشغيل' },
  { clause: '9', en: 'Performance Evaluation', ar: 'تقييم الأداء' },
  { clause: '10', en: 'Improvement', ar: 'التحسين' },
];

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, tAuditType } = useLang();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [busyClause, setBusyClause] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [a, p, r] = await Promise.all([
      supabase.from('audits').select('*, clients(id, name, name_ar, client_number, standards), auditors(id, name, color)').eq('id', id).single(),
      supabase.from('audit_plan_items').select('*').eq('audit_id', id).order('sort_order'),
      supabase.from('audit_results').select('*').eq('audit_id', id).order('clause'),
    ]);
    setAudit(a.data as Audit);
    setPlan((p.data as PlanItem[]) ?? []);
    setResults((r.data as AuditResult[]) ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function initChecklist() {
    if (!audit) return;
    const supabase = createClient();
    await supabase.from('audit_results').insert(
      DEFAULT_CLAUSES.map((c) => ({
        audit_id: audit.id,
        standard_code: audit.clients?.standards?.[0] ?? 'ISO 9001',
        clause: c.clause,
        clause_name: lang === 'ar' ? c.ar : c.en,
        status: 'C',
      }))
    );
    await load();
  }

  async function setStatus(r: AuditResult, status: ResultStatus) {
    if (!audit) return;
    setBusyClause(r.id);
    const supabase = createClient();
    await supabase.from('audit_results').update({ status }).eq('id', r.id);
    if (status === 'NCR' && r.status !== 'NCR') {
      const ncNumber = `NC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
      await supabase.from('non_conformities').insert({
        audit_id: audit.id,
        client_id: audit.client_id,
        nc_number: ncNumber,
        nc_type: 'MN',
        standard_code: r.standard_code,
        clause: r.clause,
        description: r.comments || `Non-conformity in clause ${r.clause} — ${r.clause_name ?? ''}`,
        deadline: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
        status: 'open',
      });
      await supabase.from('activity_log').insert({
        entity: 'nc', client_id: audit.client_id, action: 'open',
        description_ar: `${ncNumber} opened from ${audit.audit_type} audit — clause ${r.clause}`, actor: 'admin',
      });
    }
    setResults((cur) => cur.map((x) => (x.id === r.id ? { ...x, status } : x)));
    setBusyClause(null);
  }

  async function saveComment(r: AuditResult, comments: string) {
    await createClient().from('audit_results').update({ comments }).eq('id', r.id);
  }

  if (!audit) return <div className="space-y-4"><Skeleton className="h-28" /><Skeleton className="h-96" /></div>;

  const ncCount = results.filter((r) => r.status === 'NCR').length;
  const obsCount = results.filter((r) => r.status === 'O').length;
  const days = Array.from(new Set(plan.map((p) => p.day_no))).sort();

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-navy-800">
              {tAuditType(audit.audit_type)} {t('audit_label')}
            </h1>
            <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${audit.status === 'completed' ? 'bg-green-50 text-status-green' : 'bg-gold-50 text-gold-600'}`}>
              {audit.status === 'completed' ? t('completed') : t('planned')}
            </span>
          </div>
          <Link href={`/clients/${audit.client_id}`} className="text-sm font-semibold text-navy-500 hover:text-gold-600">
            {audit.clients?.name} <span dir="ltr" className="font-inter text-xs">({audit.clients?.client_number})</span>
          </Link>
          <p className="mt-0.5 font-inter text-xs text-navy-400" dir="ltr">{audit.start_date}{audit.end_date && audit.end_date !== audit.start_date ? ` → ${audit.end_date}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl bg-red-50 px-4 py-2 text-center">
            <p className="flex items-center gap-1 text-xl font-bold text-status-red"><AlertTriangle className="h-4 w-4" />{ncCount}</p>
            <p className="text-[10px] font-bold text-status-red">NCR</p>
          </div>
          <div className="rounded-xl bg-gold-50 px-4 py-2 text-center">
            <p className="text-xl font-bold text-gold-600">{obsCount}</p>
            <p className="text-[10px] font-bold text-gold-600">{t('observations')}</p>
          </div>
          <div className="rounded-xl bg-green-50 px-4 py-2 text-center">
            <p className="text-xl font-bold text-status-green">{results.filter((r) => r.status === 'C').length}</p>
            <p className="text-[10px] font-bold text-status-green">{t('conform')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* خطة التدقيق */}
        <div className="card h-fit p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold text-navy-700">{t('audit_plan')}</h2>
          {plan.length === 0 && <p className="py-6 text-center text-sm text-navy-400">{t('no_agenda')}</p>}
          {days.map((d) => (
            <div key={d} className="mb-4">
              <p className="mb-2 text-xs font-bold text-gold-600">{t('day_n')} {d}</p>
              <ol className="space-y-2">
                {plan.filter((p) => p.day_no === d).map((p) => (
                  <li key={p.id} className="flex gap-3 rounded-lg bg-surface-gray p-2.5 text-sm dark:bg-navy-900">
                    <span className="whitespace-nowrap font-inter text-[11px] font-bold text-navy-400" dir="ltr">{p.time_from}–{p.time_to}</span>
                    <div>
                      <p className="font-semibold leading-snug text-navy-700">{p.activity}</p>
                      <p className="text-[11px] text-navy-400">{p.auditor} {p.department ? `· ${p.department}` : ''}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <div className="mt-4 rounded-lg border border-surface-border p-3 text-xs text-navy-500 dark:border-navy-600">
            <p className="font-bold">{t('audit_team')}</p>
            <p className="mt-1">{[audit.auditors?.name, ...audit.team.filter((x) => x !== audit.auditors?.name)].filter(Boolean).join(', ')}</p>
          </div>
        </div>

        {/* إدخال النتائج */}
        <div className="card p-5 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-700">{t('audit_results')}</h2>
            {results.length === 0 && (
              <button onClick={initChecklist} className="btn-primary py-1.5 text-xs"><Plus className="h-3.5 w-3.5" /> {t('create_checklist')}</button>
            )}
          </div>
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-navy-400">{t('no_results_yet')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs text-navy-400 dark:border-navy-600">
                    <th className="px-2 pb-2 text-start font-semibold">{t('clause')}</th>
                    <th className="px-2 pb-2 text-start font-semibold">{t('status')}</th>
                    <th className="px-2 pb-2 text-start font-semibold">{t('comment')}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-surface-border/60 last:border-0 dark:border-navy-600">
                      <td className="px-2 py-3 align-top">
                        <p className="font-inter font-bold text-navy-700">{r.clause}</p>
                        <p className="text-[11px] text-navy-400">{r.clause_name}</p>
                        <p className="font-inter text-[10px] text-navy-300">{r.standard_code}</p>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <div className="flex gap-1" role="group" aria-label={`${t('clause')} ${r.clause}`}>
                          {(['C', 'O', 'NCR'] as ResultStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus(r, s)}
                              disabled={busyClause === r.id}
                              aria-pressed={r.status === s}
                              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                r.status === s
                                  ? s === 'C' ? 'bg-status-green text-white' : s === 'O' ? 'bg-status-amber text-white' : 'bg-status-red text-white'
                                  : 'bg-surface-gray text-navy-400 hover:bg-navy-100 dark:bg-navy-900'
                              }`}
                            >
                              {busyClause === r.id && r.status !== s ? <Loader2 className="h-3 w-3 animate-spin" /> : s}
                            </button>
                          ))}
                        </div>
                        <div className="mt-1.5"><AuditBadge status={r.status} /></div>
                      </td>
                      <td className="px-2 py-3 align-top">
                        <textarea
                          defaultValue={r.comments ?? ''}
                          onBlur={(e) => saveComment(r, e.target.value)}
                          className="input min-h-16 text-xs"
                          placeholder={t('evidence_notes')}
                          aria-label={`${t('comment')} ${r.clause}`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {ncCount > 0 && (
            <Link href="/nc-tracker" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-bold text-status-red hover:bg-red-100">
              <AlertTriangle className="h-4 w-4" /> {ncCount} {t('ncr_created')}
            </Link>
          )}
          {audit.summary && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-navy-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-green" /> {audit.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
