'use client';
import { useEffect, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, X, FolderOpen } from 'lucide-react';
import { useLang } from '@/lib/i18n';

export function KpiCard({
  icon,
  label,
  labelEn,
  value,
  trend,
  color = 'navy',
}: {
  icon: ReactNode;
  label: string;
  labelEn?: string;
  value: string | number;
  trend?: { dir: 'up' | 'down'; text: string };
  color?: 'navy' | 'gold' | 'green' | 'red';
}) {
  const colors = {
    navy: 'bg-navy-50 text-navy-600 dark:bg-navy-700 dark:text-navy-100',
    gold: 'bg-gold-50 text-gold-600',
    green: 'bg-green-50 text-status-green',
    red: 'bg-red-50 text-status-red',
  };
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-navy-400 dark:text-slate-400">{label}</p>
          {labelEn && <p className="font-inter text-[11px] text-navy-300">{labelEn}</p>}
          <p className="mt-2 text-3xl font-bold text-navy-800 dark:text-white">{value}</p>
          {trend && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${trend.dir === 'up' ? 'text-status-green' : 'text-status-red'}`}>
              {trend.dir === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trend.text}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="card relative z-10 w-full max-w-lg animate-fade-up p-5 max-h-[85vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 dark:hover:bg-navy-700" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div role="tablist" className="no-print flex flex-wrap gap-1 border-b border-surface-border dark:border-navy-700">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`relative -mb-px rounded-t-lg px-4 py-2.5 text-sm font-semibold ${
            active === t.key
              ? 'border-b-2 border-gold bg-white text-navy-700 dark:bg-navy-800 dark:text-white'
              : 'text-navy-400 hover:bg-navy-50 hover:text-navy-600 dark:hover:bg-navy-700'
          }`}
        >
          {t.label}
          {t.count !== undefined && t.count > 0 && (
            <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-navy-900">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-surface-border py-14 text-center dark:border-navy-700">
      <span className="rounded-2xl bg-navy-50 p-4 text-navy-300 dark:bg-navy-700">
        {icon ?? <FolderOpen className="h-10 w-10" aria-hidden />}
      </span>
      <p className="font-bold text-navy-600 dark:text-slate-200">{title}</p>
      {hint && <p className="max-w-sm text-sm text-navy-400">{hint}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

const LIFECYCLE_STEPS: [string, string][] = [
  ['Stage 1', 'المرحلة 1'],
  ['Stage 2', 'المرحلة 2'],
  ['Certified', 'إصدار الشهادة'],
  ['SUR 1', 'مراقبة 1'],
  ['SUR 2', 'مراقبة 2'],
  ['Recert', 'إعادة اعتماد'],
];

export function LifecycleIndicator({ current }: { current: number }) {
  const { lang } = useLang();
  const steps = LIFECYCLE_STEPS.map((s) => (lang === 'ar' ? s[1] : s[0]));
  return (
    <div aria-label={`Certification cycle: step ${current + 1} of ${steps.length}`}>
      <div className="flex items-center">
        {steps.map((step, i) => (
          <div key={step} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  i < current ? 'bg-status-green text-white' : i === current ? 'bg-gold text-navy-900 ring-4 ring-gold-50' : 'bg-navy-100 text-navy-400 dark:bg-navy-700'
                }`}
              >
                {i + 1}
              </span>
              {i < LIFECYCLE_STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 ${i < current ? 'bg-status-green' : 'bg-navy-100 dark:bg-navy-700'}`} aria-hidden />
              )}
            </div>
            <span className={`whitespace-nowrap text-[10px] font-semibold ${i === current ? 'text-gold-600' : 'text-navy-400'}`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
