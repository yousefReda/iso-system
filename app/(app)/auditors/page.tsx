'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, CheckCircle2, XCircle, Loader2, Plus, FolderCog } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Modal, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import { STANDARD_CODES, type Auditor, type Client } from '@/lib/types';
import type { AssignmentCheckResult } from '@/lib/calculator/auditor-planning';

interface Booking {
  id: string; client_id: string; auditor_id: string; standard_code: string | null;
  iaf_code: string | null; audit_type: string; start_date: string; end_date: string;
  final_status: string; clients?: { name: string } | null;
}

const MONTHS: Record<'en' | 'ar', string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
const DAYS: Record<'en' | 'ar', string[]> = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};
const COLORS = ['#1B3A6B', '#2E5FA3', '#E8A020', '#1A7A4A', '#C0392B', '#7C3AED', '#0891B2', '#DB2777'];

export default function AuditorsPage() {
  const { t, lang, dir } = useLang();
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [bookingDay, setBookingDay] = useState<string | null>(null);
  const [form, setForm] = useState({ clientId: '', auditorId: '', standard: '', iaf: '', type: 'Stage1', start: '', end: '' });
  const [check, setCheck] = useState<AssignmentCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  // إضافة مدقق جديد
  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [newAuditor, setNewAuditor] = useState({ name: '', email: '', phone: '', role: 'auditor', standards: [] as string[], iafs: '', color: COLORS[1] });

  const load = useCallback(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('auditors').select('*').eq('is_active', true).order('name'),
      supabase.from('clients').select('*').order('name'),
      supabase.from('auditor_planning').select('*, clients(name)'),
    ]).then(([a, c, b]) => {
      setAuditors((a.data as Auditor[]) ?? []);
      setClients((c.data as Client[]) ?? []);
      setBookings((b.data as Booking[]) ?? []);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.auditorId || !form.start || !form.end) { setCheck(null); return; }
    setChecking(true);
    const timer = setTimeout(async () => {
      const res = await fetch('/api/auditor-planning/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorId: form.auditorId, standardCode: form.standard, iafCode: form.iaf, startDate: form.start, endDate: form.end }),
      });
      setCheck(res.ok ? await res.json() : null);
      setChecking(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [form.auditorId, form.standard, form.iaf, form.start, form.end]);

  const daysGrid = useMemo(() => {
    const first = new Date(month.y, month.m, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
    const cells: (string | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${month.y}-${String(month.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [month]);

  function bookingsOn(date: string) {
    return (bookings ?? []).filter((b) => b.start_date <= date && date <= b.end_date);
  }

  function openBooking(date: string) {
    setForm({ clientId: '', auditorId: '', standard: '', iaf: '', type: 'Stage1', start: date, end: date });
    setCheck(null);
    setBookingDay(date);
  }

  async function saveBooking() {
    setSaving(true);
    await fetch('/api/auditor-planning/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auditorId: form.auditorId, standardCode: form.standard, iafCode: form.iaf,
        startDate: form.start, endDate: form.end, save: true, clientId: form.clientId, auditType: form.type,
      }),
    });
    setSaving(false);
    setBookingDay(null);
    load();
  }

  async function saveAuditor() {
    setAddBusy(true);
    await createClient().from('auditors').insert({
      name: newAuditor.name.toUpperCase(),
      email: newAuditor.email || null,
      phone: newAuditor.phone || null,
      role: newAuditor.role,
      certified_standards: newAuditor.standards,
      certified_iaf_codes: newAuditor.iafs.split(',').map((x) => x.trim()).filter(Boolean),
      color: newAuditor.color,
    });
    setAddBusy(false);
    setAddOpen(false);
    setNewAuditor({ name: '', email: '', phone: '', role: 'auditor', standards: [], iafs: '', color: COLORS[1] });
    load();
  }

  if (!bookings) return <Skeleton className="h-96" />;
  const selectedClient = clients.find((c) => c.id === form.clientId);
  const PrevIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const NextIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('auditors_calendar')}</h1>
          <p className="text-sm text-navy-400">{t('auditors_sub')}</p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-gold"><Plus className="h-4 w-4" /> {t('add_auditor')}</button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <div className="card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }))} className="btn-outline px-2 py-1.5" aria-label={t('prev_month')}><NextIcon className="h-4 w-4" /></button>
            <h2 className="text-lg font-bold text-navy-700">{MONTHS[lang][month.m]} <span className="font-inter">{month.y}</span></h2>
            <button onClick={() => setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }))} className="btn-outline px-2 py-1.5" aria-label={t('next_month')}><PrevIcon className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {DAYS[lang].map((d) => <p key={d} className="pb-1 text-center text-[11px] font-bold text-navy-400">{d}</p>)}
            {daysGrid.map((date, i) =>
              date === null ? (
                <div key={`pad${i}`} />
              ) : (
                <button
                  key={date}
                  onClick={() => openBooking(date)}
                  className="group relative min-h-20 rounded-lg border border-surface-border bg-white p-1.5 text-start hover:border-gold dark:border-navy-600 dark:bg-navy-900"
                  aria-label={`${t('booking')} ${date}`}
                >
                  <span className="font-inter text-xs font-bold text-navy-500">{Number(date.slice(8))}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {bookingsOn(date).slice(0, 4).map((b) => {
                      const auditor = auditors.find((a) => a.id === b.auditor_id);
                      return (
                        <span
                          key={b.id}
                          className="block h-2.5 w-2.5 rounded-full ring-1 ring-white dark:ring-navy-900"
                          style={{ background: auditor?.color ?? '#2E5FA3' }}
                          title={`${auditor?.name} — ${b.clients?.name ?? ''} (${b.audit_type})`}
                        />
                      );
                    })}
                  </span>
                  {bookingsOn(date).length > 0 && (
                    <span className="pointer-events-none absolute start-1/2 top-full z-10 hidden w-max max-w-52 -translate-x-1/2 rounded-lg bg-navy-800 px-2.5 py-1.5 text-start text-[10px] leading-relaxed text-white shadow-card-hover group-hover:block rtl:translate-x-1/2">
                      {bookingsOn(date).map((b) => (
                        <span key={b.id} className="block">{auditors.find((a) => a.id === b.auditor_id)?.name}: {b.clients?.name} ({b.audit_type})</span>
                      ))}
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {/* لوحة المدققين */}
        <div className="card h-fit max-h-[70vh] overflow-y-auto p-4">
          <h2 className="mb-3 font-bold text-navy-700">{t('auditors')} ({auditors.length})</h2>
          <ul className="space-y-2">
            {auditors.map((a) => (
              <li key={a.id} className="rounded-lg border border-surface-border p-2.5 dark:border-navy-600">
                <div className="flex items-center justify-between gap-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-navy-700">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: a.color }} aria-hidden />
                    {a.name}
                  </p>
                  <Link href={`/auditor-files?a=${a.id}`} className="rounded p-1 text-navy-400 hover:text-gold-600" title={t('files')} aria-label={`${t('files')} ${a.name}`}>
                    <FolderCog className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="ms-5 text-[10px] text-navy-400">{a.certified_standards.slice(0, 4).join(', ') || (a.role === 'technical_expert' ? t('technical_expert') : '—')}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal الحجز */}
      <Modal open={!!bookingDay} onClose={() => setBookingDay(null)} title={`${t('booking')} — ${bookingDay ?? ''}`}>
        <div className="space-y-3">
          <div><label className="label">{t('client')}</label>
            <select className="input" value={form.clientId} onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value);
              setForm((f) => ({ ...f, clientId: e.target.value, standard: c?.standards[0] ?? '', iaf: c?.iaf_codes[0] ?? '' }));
            }}>
              <option value="">{t('select')}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label className="label">{t('auditor')}</label>
            <select className="input" value={form.auditorId} onChange={(e) => setForm((f) => ({ ...f, auditorId: e.target.value }))}>
              <option value="">{t('select')}</option>
              {auditors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('standard')}</label>
              <select className="input" value={form.standard} onChange={(e) => setForm((f) => ({ ...f, standard: e.target.value }))}>
                <option value="">—</option>
                {(selectedClient?.standards ?? [...STANDARD_CODES]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="label">IAF Code</label>
              <input className="input font-inter" dir="ltr" value={form.iaf} onChange={(e) => setForm((f) => ({ ...f, iaf: e.target.value }))} placeholder="31" />
            </div>
            <div><label className="label">{t('from')}</label><input type="date" className="input font-inter" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} /></div>
            <div><label className="label">{t('to')}</label><input type="date" className="input font-inter" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} /></div>
          </div>

          {(check || checking) && (
            <div className="rounded-xl border border-surface-border p-3 dark:border-navy-600">
              {checking ? (
                <p className="flex items-center gap-2 text-sm text-navy-400"><Loader2 className="h-4 w-4 animate-spin" /> {t('checking')}</p>
              ) : check && (
                <div className="space-y-1.5 text-sm">
                  {[
                    [check.isCertifiedStandard, t('cert_on_standard')],
                    [check.isCertifiedIaf, t('cert_on_iaf')],
                    [!check.hasDateConflict, t('no_date_conflict')],
                  ].map(([ok, label]) => (
                    <p key={label as string} className={`flex items-center gap-2 font-semibold ${ok ? 'text-status-green' : 'text-status-red'}`}>
                      {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {label}
                    </p>
                  ))}
                  <div className={`mt-2 rounded-lg py-2 text-center text-sm font-bold text-white ${check.finalStatus === 'OK' ? 'bg-status-green' : 'bg-status-red'}`}>
                    {check.finalStatus === 'OK' ? t('ok_can_assign') : t('not_ok')}
                  </div>
                  {check.reasons.map((r) => <p key={r} className="text-xs text-status-red">• {r}</p>)}
                </div>
              )}
            </div>
          )}

          <button
            onClick={saveBooking}
            disabled={saving || !form.clientId || !form.auditorId || !form.start || !form.end}
            className={check?.finalStatus === 'OK' ? 'btn-primary w-full' : 'btn-danger w-full'}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {check?.finalStatus === 'OK' ? t('confirm_booking') : t('save_anyway')}
          </button>
        </div>
      </Modal>

      {/* Modal إضافة مدقق */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('add_auditor')}>
        <div className="space-y-3">
          <div><label className="label">{t('auditor_name')} *</label><input className="input font-inter" value={newAuditor.name} onChange={(e) => setNewAuditor((f) => ({ ...f, name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('email')}</label><input type="email" dir="ltr" className="input font-inter" value={newAuditor.email} onChange={(e) => setNewAuditor((f) => ({ ...f, email: e.target.value }))} /></div>
            <div><label className="label">{t('phone')}</label><input dir="ltr" className="input font-inter" value={newAuditor.phone} onChange={(e) => setNewAuditor((f) => ({ ...f, phone: e.target.value }))} /></div>
          </div>
          <div><label className="label">{t('role')}</label>
            <select className="input" value={newAuditor.role} onChange={(e) => setNewAuditor((f) => ({ ...f, role: e.target.value }))}>
              <option value="auditor">{t('auditor_role')}</option>
              <option value="lead_auditor">{t('lead_auditor_role')}</option>
              <option value="technical_expert">{t('technical_expert')}</option>
              <option value="reviewer">{t('reviewer')}</option>
            </select>
          </div>
          <div>
            <p className="label">{t('certified_standards')}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {STANDARD_CODES.map((s) => (
                <label key={s} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-inter font-bold ${newAuditor.standards.includes(s) ? 'border-gold bg-gold-50 text-navy-700' : 'border-surface-border text-navy-500 dark:border-navy-600'}`}>
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-gold"
                    checked={newAuditor.standards.includes(s)}
                    onChange={() => setNewAuditor((f) => ({ ...f, standards: f.standards.includes(s) ? f.standards.filter((x) => x !== s) : [...f.standards, s] }))}
                  />
                  {s.replace('ISO ', '')}
                </label>
              ))}
            </div>
          </div>
          <div><label className="label">{t('certified_iafs')}</label><input dir="ltr" className="input font-inter" placeholder="28, 31, 33" value={newAuditor.iafs} onChange={(e) => setNewAuditor((f) => ({ ...f, iafs: e.target.value }))} /></div>
          <div>
            <p className="label">{t('color')}</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setNewAuditor((f) => ({ ...f, color: c }))} className={`h-7 w-7 rounded-full ${newAuditor.color === c ? 'ring-2 ring-gold ring-offset-2' : ''}`} style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </div>
          <button onClick={saveAuditor} disabled={addBusy || newAuditor.name.trim().length < 2} className="btn-gold w-full">
            {addBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('add_auditor')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
