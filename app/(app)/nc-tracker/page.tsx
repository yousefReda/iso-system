'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NCBadge } from '@/components/ui/badges';
import { Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { NCStatus, NonConformity } from '@/lib/types';

const COLUMNS: NCStatus[] = ['open', 'response_received', 'under_review', 'closed'];
const COL_STYLE: Record<NCStatus, string> = {
  open: 'border-t-status-red',
  response_received: 'border-t-navy-500',
  under_review: 'border-t-status-amber',
  closed: 'border-t-status-green',
};

export default function NcTrackerPage() {
  const { t, tNCStatus } = useLang();
  const [ncs, setNcs] = useState<NonConformity[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<NCStatus | null>(null);

  useEffect(() => {
    createClient()
      .from('non_conformities')
      .select('*, clients(id, name, name_ar)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setNcs((data as NonConformity[]) ?? []));
  }, []);

  async function moveTo(id: string, status: NCStatus) {
    if (!ncs) return;
    const nc = ncs.find((n) => n.id === id);
    if (!nc || nc.status === status) return;
    const closedDate = status === 'closed' ? new Date().toISOString().slice(0, 10) : null;
    setNcs((cur) => cur!.map((n) => (n.id === id ? { ...n, status, closed_date: closedDate } : n)));
    const supabase = createClient();
    await supabase.from('non_conformities').update({ status, closed_date: closedDate }).eq('id', id);
    await supabase.from('activity_log').insert({
      entity: 'nc', entity_id: id, client_id: nc.client_id, action: 'move',
      description_ar: `${nc.nc_number} moved to "${status}"`, actor: 'admin',
    });
  }

  if (!ncs) return <Skeleton className="h-96" />;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('nc_tracker')}</h1>
        <p className="text-sm text-navy-400">{t('nc_sub')} — {ncs.filter((n) => n.status !== 'closed').length} {t('open_count')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = ncs.filter((n) => n.status === col);
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId) moveTo(dragId, col);
                setDragId(null);
                setOverCol(null);
              }}
              className={`card border-t-4 p-3 ${COL_STYLE[col]} ${overCol === col ? 'ring-2 ring-gold' : ''}`}
              aria-label={tNCStatus(col)}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="font-bold text-navy-700">{tNCStatus(col)}</h2>
                <span className="rounded-full bg-surface-gray px-2 py-0.5 text-xs font-bold text-navy-500 dark:bg-navy-900">{items.length}</span>
              </div>
              <div className="min-h-32 space-y-2">
                {items.map((n) => {
                  const overdue = n.status !== 'closed' && n.deadline && n.deadline < today;
                  return (
                    <div
                      key={n.id}
                      draggable
                      onDragStart={() => setDragId(n.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      className={`cursor-grab rounded-lg border border-surface-border bg-white p-3 shadow-card active:cursor-grabbing dark:border-navy-600 dark:bg-navy-900 ${dragId === n.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-inter text-xs font-bold text-navy-700">{n.nc_number}</span>
                        <NCBadge type={n.nc_type} />
                      </div>
                      <p className="mt-1 text-[11px] text-navy-400">{n.standard_code} · {t('clause')} {n.clause}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-navy-600">{n.description}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Link href={`/clients/${n.client_id}?tab=nc`} className="truncate text-[11px] font-bold text-navy-500 hover:text-gold-600">
                          {n.clients?.name}
                        </Link>
                        {n.deadline && (
                          <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-inter text-[10px] font-bold ${overdue ? 'bg-red-50 text-status-red' : 'bg-surface-gray text-navy-400 dark:bg-navy-800'}`} dir="ltr">
                            <CalendarClock className="h-3 w-3" /> {n.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-surface-border py-6 text-center text-xs text-navy-300 dark:border-navy-600">
                    {t('no_cards')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
