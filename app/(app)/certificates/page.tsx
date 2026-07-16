'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Printer, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EmptyState, Skeleton } from '@/components/ui/core';
import { StandardTags } from '@/components/ui/badges';
import { useLang } from '@/lib/i18n';
import type { Client } from '@/lib/types';

export default function CertificatesPage() {
  const { t } = useLang();
  const [clients, setClients] = useState<Client[] | null>(null);

  useEffect(() => {
    createClient()
      .from('clients')
      .select('*')
      .not('cert_number', 'is', null)
      .order('cert_expiry_date', { ascending: true })
      .then(({ data }) => setClients((data as Client[]) ?? []));
  }, []);

  if (!clients) return <Skeleton className="h-96" />;

  const today = new Date().toISOString().slice(0, 10);
  const in90 = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);

  function certState(c: Client): { label: string; cls: string } {
    if (c.status === 'suspended') return { label: t('suspended'), cls: 'bg-red-50 text-status-red' };
    if (!c.cert_expiry_date || c.cert_expiry_date < today) return { label: t('expired'), cls: 'bg-slate-100 text-slate-500' };
    if (c.cert_expiry_date <= in90) return { label: t('expiring_soon'), cls: 'bg-gold-50 text-gold-600' };
    return { label: t('valid'), cls: 'bg-green-50 text-status-green' };
  }

  function progress(c: Client): number {
    if (!c.cert_issue_date || !c.cert_expiry_date) return 0;
    const start = new Date(c.cert_issue_date).getTime();
    const end = new Date(c.cert_expiry_date).getTime();
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('certificates')}</h1>
        <p className="text-sm text-navy-400">{t('certs_sub')}</p>
      </div>

      {clients.length === 0 ? (
        <EmptyState title={t('no_certs')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => {
            const st = certState(c);
            const pct = progress(c);
            return (
              <div key={c.id} className="card card-hover p-5">
                <div className="flex items-start justify-between">
                  <span className="rounded-xl bg-gold-50 p-2.5 text-gold-600"><Award className="h-6 w-6" /></span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <h3 className="mt-3 font-bold text-navy-700">{c.name}</h3>
                <p className="font-inter text-xs font-bold text-gold-600" dir="ltr">{c.cert_number}</p>
                <div className="mt-2"><StandardTags standards={c.standards} max={4} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-navy-400">{t('issue_date')}</p><p className="font-inter font-bold text-navy-700" dir="ltr">{c.cert_issue_date}</p></div>
                  <div><p className="text-navy-400">{t('cert_expiry')}</p><p className="font-inter font-bold text-navy-700" dir="ltr">{c.cert_expiry_date}</p></div>
                </div>
                {/* شريط تقدم دورة الثلاث سنوات */}
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-navy-100 dark:bg-navy-700">
                    <div
                      className={`h-full rounded-full ${pct > 85 ? 'bg-status-red' : pct > 60 ? 'bg-status-amber' : 'bg-status-green'}`}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-navy-400">{Math.round(pct)}% — 3Y cycle</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/forms/F06-14?client=${c.id}`} className="btn-primary flex-1 py-1.5 text-xs"><Eye className="h-3.5 w-3.5" /> {t('view_certificate')}</Link>
                  <Link href={`/forms/F06-14?client=${c.id}&print=1`} className="btn-outline py-1.5 text-xs" aria-label={t('print_pdf')}><Printer className="h-3.5 w-3.5" /></Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
