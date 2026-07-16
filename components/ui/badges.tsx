'use client';
import { useLang } from '@/lib/i18n';
import type { ClientStatus, NCStatus, NCType, ResultStatus } from '@/lib/types';

const statusStyles: Record<ClientStatus, string> = {
  active: 'bg-green-50 text-status-green border-green-200',
  pending: 'bg-gold-50 text-gold-600 border-gold-100',
  suspended: 'bg-red-50 text-status-red border-red-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  const { tClientStatus } = useLang();
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusStyles[status] ?? statusStyles.pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {tClientStatus(status)}
    </span>
  );
}

export function NCBadge({ type }: { type: NCType }) {
  const { lang } = useLang();
  const title = type === 'MJ'
    ? lang === 'ar' ? 'عدم مطابقة كبرى' : 'Major Non-Conformity'
    : lang === 'ar' ? 'عدم مطابقة صغرى' : 'Minor Non-Conformity';
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold text-white ${type === 'MJ' ? 'bg-status-red' : 'bg-status-amber'}`} title={title}>
      {type}
    </span>
  );
}

export function NCStatusBadge({ status }: { status: NCStatus }) {
  const { tNCStatus } = useLang();
  const styles: Record<NCStatus, string> = {
    open: 'bg-red-50 text-status-red border-red-200',
    response_received: 'bg-blue-50 text-navy-500 border-blue-200',
    under_review: 'bg-gold-50 text-gold-600 border-gold-100',
    closed: 'bg-green-50 text-status-green border-green-200',
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles[status]}`}>
      {tNCStatus(status)}
    </span>
  );
}

export function AuditBadge({ status }: { status: ResultStatus }) {
  const { lang } = useLang();
  const map: Record<ResultStatus, { cls: string; en: string; ar: string }> = {
    C: { cls: 'bg-status-green', en: 'Conform', ar: 'مطابق' },
    O: { cls: 'bg-status-amber', en: 'Observation', ar: 'ملاحظة' },
    NCR: { cls: 'bg-status-red', en: 'Non-Conformity', ar: 'عدم مطابقة' },
  };
  const m = map[status];
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-bold text-white ${m.cls}`} title={lang === 'ar' ? m.ar : m.en}>
      {status}
    </span>
  );
}

export function StandardTags({ standards, max = 3 }: { standards: string[]; max?: number }) {
  const shown = standards.slice(0, max);
  const rest = standards.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((s) => (
        <span key={s} className="rounded bg-navy-50 px-1.5 py-0.5 text-[11px] font-semibold text-navy-600 dark:bg-navy-700 dark:text-navy-100">
          {s}
        </span>
      ))}
      {rest > 0 && <span className="text-[11px] text-navy-400">+{rest}</span>}
    </span>
  );
}
