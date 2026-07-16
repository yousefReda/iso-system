'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FORM_LIST } from '@/lib/forms/definitions';
import { Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Client, FormGenerated } from '@/lib/types';

function FormsCenter() {
  const params = useSearchParams();
  const { t, lang } = useLang();
  const [clients, setClients] = useState<Client[]>([]);
  const [generated, setGenerated] = useState<FormGenerated[]>([]);
  const [clientId, setClientId] = useState(params.get('client') ?? '');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('forms_generated').select('*'),
    ]).then(([c, f]) => {
      setClients((c.data as Client[]) ?? []);
      setGenerated((f.data as FormGenerated[]) ?? []);
      setLoaded(true);
    });
  }, []);

  function statusFor(code: string): { label: string; cls: string } {
    const rows = generated.filter((g) => g.form_code === code && (!clientId || g.client_id === clientId));
    if (rows.some((r) => r.status === 'printed')) return { label: t('printed'), cls: 'bg-green-50 text-status-green' };
    if (rows.some((r) => r.status === 'completed')) return { label: t('completed'), cls: 'bg-navy-50 text-navy-600 dark:bg-navy-700 dark:text-navy-100' };
    if (rows.length) return { label: t('draft'), cls: 'bg-gold-50 text-gold-600' };
    return { label: t('not_generated'), cls: 'bg-slate-100 text-slate-500' };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('forms_center')}</h1>
          <p className="text-sm text-navy-400">{t('forms_sub')}</p>
        </div>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input w-64" aria-label={t('client')}>
          <option value="">{t('select_client_autofill')}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FORM_LIST.map((f) => {
            const st = statusFor(f.code);
            const href = `/forms/${f.code}${clientId ? `?client=${clientId}` : ''}`;
            return (
              <div key={f.code} className="card card-hover flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className="text-3xl" aria-hidden>{f.icon}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <p className="mt-3 font-inter text-xs font-bold text-gold-600" dir="ltr">ISO-{f.code}</p>
                <h3 className="mt-1 font-bold leading-snug text-navy-700">{lang === 'ar' ? f.title_ar : f.title_en}</h3>
                <p className={`text-[11px] text-navy-400 ${lang === 'ar' ? 'font-inter' : ''}`} dir={lang === 'ar' ? 'ltr' : 'rtl'}>
                  {lang === 'ar' ? f.title_en : f.title_ar}
                </p>
                <div className="mt-auto flex gap-2 pt-4">
                  <Link href={href} className="btn-outline flex-1 py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> {t('view')}</Link>
                  <Link href={href} className="btn-primary flex-1 py-1.5 text-xs"><Wand2 className="h-3.5 w-3.5" /> {t('generate')}</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FormsPage() {
  return <Suspense fallback={<Skeleton className="h-96" />}><FormsCenter /></Suspense>;
}
