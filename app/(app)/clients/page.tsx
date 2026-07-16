'use client';
import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Eye, Pencil, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge, StandardTags } from '@/components/ui/badges';
import { EmptyState, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Client, ClientStatus } from '@/lib/types';

const PAGE_SIZE = 8;

function ClientsList() {
  const params = useSearchParams();
  const { t, dir, tClientStatus } = useLang();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    createClient()
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setClients((data as Client[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!clients) return [];
    return clients.filter((c) => {
      const matchesQ =
        !q ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        (c.name_ar ?? '').includes(q) ||
        c.client_number.toLowerCase().includes(q.toLowerCase());
      const matchesS = status === 'all' || c.status === status;
      return matchesQ && matchesS;
    });
  }, [clients, q, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('clients')}</h1>
          <p className="text-sm text-navy-400">{clients?.length ?? '…'} {t('clients_registered')}</p>
        </div>
        <Link href="/clients/new" className="btn-gold"><Plus className="h-4 w-4" /> {t('new_client')}</Link>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="input ps-9"
            placeholder={t('search_name_number')}
            aria-label={t('search_name_number')}
          />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input w-44" aria-label={t('status')}>
          <option value="all">{t('all_statuses')}</option>
          {(['active', 'pending', 'suspended', 'expired'] as ClientStatus[]).map((s) => (
            <option key={s} value={s}>{tClientStatus(s)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {!clients ? (
          <div className="space-y-3 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : pageItems.length === 0 ? (
          <div className="p-6">
            <EmptyState title={t('no_matching_clients')} hint={t('try_adjust')} action={<Link href="/clients/new" className="btn-primary"><Plus className="h-4 w-4" /> {t('new_client')}</Link>} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-gray/60 text-xs text-navy-500 dark:border-navy-600 dark:bg-navy-900/40">
                  <th className="px-4 py-3 text-start font-semibold">{t('client')}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t('status')}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t('standards')}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t('employees')}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t('cert_expiry')}</th>
                  <th className="px-4 py-3 text-start font-semibold">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id} className="border-b border-surface-border/60 last:border-0 hover:bg-navy-50/50 dark:border-navy-600 dark:hover:bg-navy-700/40">
                    <td className="px-4 py-3">
                      <Link href={`/clients/${c.id}`} className="block">
                        <p className="font-bold text-navy-700 hover:text-gold-600">{c.name}</p>
                        <p className="font-inter text-[11px] text-navy-400" dir="ltr">{c.client_number}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status as ClientStatus} /></td>
                    <td className="px-4 py-3"><StandardTags standards={c.standards} /></td>
                    <td className="px-4 py-3 font-inter">{c.employees}</td>
                    <td className="px-4 py-3 font-inter text-xs" dir="ltr">{c.cert_expiry_date ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/clients/${c.id}`} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-700" title={t('view')} aria-label={`${t('view')} ${c.name}`}><Eye className="h-4 w-4" /></Link>
                        <Link href={`/clients/${c.id}?tab=data&edit=1`} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-700" title={t('edit')} aria-label={`${t('edit')} ${c.name}`}><Pencil className="h-4 w-4" /></Link>
                        <Link href={`/forms?client=${c.id}`} className="rounded-lg p-1.5 text-navy-400 hover:bg-navy-50 hover:text-navy-700 dark:hover:bg-navy-700" title={t('forms')} aria-label={`${t('forms')} ${c.name}`}><FileText className="h-4 w-4" /></Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {clients && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 dark:border-navy-600">
            <p className="text-xs text-navy-400">
              {t('showing')} {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} {t('of')} {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline px-2 py-1.5" aria-label={t('previous')}><PrevIcon className="h-4 w-4" /></button>
              <span className="px-2 text-sm font-bold text-navy-600">{page} / {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-outline px-2 py-1.5" aria-label={t('next')}><NextIcon className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <ClientsList />
    </Suspense>
  );
}
