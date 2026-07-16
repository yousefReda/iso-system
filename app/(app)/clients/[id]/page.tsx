'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Upload, Camera, FileArchive, Trash2, FileText, Loader2, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge, StandardTags, NCBadge, NCStatusBadge } from '@/components/ui/badges';
import { Tabs, LifecycleIndicator, EmptyState, Skeleton } from '@/components/ui/core';
import { FORM_LIST } from '@/lib/forms/definitions';
import { useLang } from '@/lib/i18n';
import type { ActivityItem, Audit, Client, FormGenerated, NonConformity } from '@/lib/types';

interface Attachment { id: string; kind: string; name: string; storage_path: string; mime_type: string | null; created_at: string; }

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang, tAuditType } = useLang();
  const [client, setClient] = useState<Client | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [ncs, setNcs] = useState<NonConformity[]>([]);
  const [forms, setForms] = useState<FormGenerated[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [tab, setTab] = useState('data');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadKind = useRef<'site_photo' | 'audit_file'>('site_photo');

  const load = useCallback(async () => {
    const supabase = createClient();
    const [c, a, n, f, act, att] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('audits').select('*, auditors(id, name, color)').eq('client_id', id).order('start_date'),
      supabase.from('non_conformities').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('forms_generated').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('client_attachments').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    ]);
    setClient(c.data as Client);
    setAudits((a.data as Audit[]) ?? []);
    setNcs((n.data as NonConformity[]) ?? []);
    setForms((f.data as FormGenerated[]) ?? []);
    setActivity((act.data as ActivityItem[]) ?? []);
    setAttachments((att.data as Attachment[]) ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploading(true);
    const supabase = createClient();
    const path = `clients/${client.id}/${uploadKind.current}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from('client-files').upload(path, file);
    if (!error) {
      await supabase.from('client_attachments').insert({
        client_id: client.id, kind: uploadKind.current, name: file.name,
        storage_path: path, mime_type: file.type, size_bytes: file.size,
      });
      await load();
    }
    setUploading(false);
    e.target.value = '';
  }

  async function deleteAttachment(att: Attachment) {
    if (!confirm(`${t('delete')} "${att.name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from('client-files').remove([att.storage_path]);
    await supabase.from('client_attachments').delete().eq('id', att.id);
    await load();
  }

  function publicUrl(path: string) {
    return createClient().storage.from('client-files').getPublicUrl(path).data.publicUrl;
  }

  if (!client) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-80" /></div>;

  const done = new Set(audits.filter((a) => a.status === 'completed').map((a) => a.audit_type));
  let lifecycleStep = 0;
  if (done.has('Stage1')) lifecycleStep = 1;
  if (done.has('Stage2')) lifecycleStep = 2;
  if (client.cert_number) lifecycleStep = 3;
  if (done.has('SUR1')) lifecycleStep = 4;
  if (done.has('SUR2')) lifecycleStep = 5;

  const openNcCount = ncs.filter((n) => n.status !== 'closed').length;
  const kindLabel = (k: string) => (k === 'site_photo' ? t('site_photo') : k === 'audit_file' ? t('audit_file') : t('document'));

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-navy-800">{client.name}</h1>
              <StatusBadge status={client.status} />
            </div>
            {client.name_ar && <p className="text-navy-500">{client.name_ar}</p>}
            <p className="mt-1 font-inter text-sm text-navy-400" dir="ltr">
              {client.client_number} {client.cert_number ? `· Cert: ${client.cert_number}` : ''}
            </p>
            <div className="mt-2"><StandardTags standards={client.standards} max={6} /></div>
          </div>
          <div className="flex gap-3 text-center">
            <div className="rounded-xl bg-surface-gray px-4 py-2 dark:bg-navy-900"><p className="text-lg font-bold text-navy-700">{audits.length}</p><p className="text-[11px] text-navy-400">{t('audits_count')}</p></div>
            <div className="rounded-xl bg-surface-gray px-4 py-2 dark:bg-navy-900"><p className={`text-lg font-bold ${openNcCount ? 'text-status-red' : 'text-status-green'}`}>{openNcCount}</p><p className="text-[11px] text-navy-400">{t('open_nc_count')}</p></div>
            <div className="rounded-xl bg-surface-gray px-4 py-2 dark:bg-navy-900"><p className="text-lg font-bold text-navy-700" dir="ltr">{client.cert_expiry_date ?? '—'}</p><p className="text-[11px] text-navy-400">{t('cert_expiry')}</p></div>
          </div>
        </div>
        <div className="mt-6"><LifecycleIndicator current={lifecycleStep} /></div>
      </div>

      <Tabs
        tabs={[
          { key: 'data', label: t('data_tab') },
          { key: 'audits', label: t('audits_tab'), count: audits.length },
          { key: 'forms', label: t('forms_tab'), count: forms.length },
          { key: 'files', label: t('files_tab'), count: attachments.length },
          { key: 'nc', label: t('nc_tab'), count: openNcCount },
          { key: 'log', label: t('log_tab') },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'data' && (
        <div className="card grid grid-cols-1 gap-x-8 gap-y-3 p-6 text-sm md:grid-cols-2 animate-fade-up">
          {[
            [t('address'), client.address], [t('city'), `${client.city ?? ''} ${client.country ?? ''}`],
            [t('contact_person'), `${client.contact_person ?? '—'} ${client.position ? `(${client.position})` : ''}`],
            [t('email'), client.email], [t('phone'), client.phone],
            [t('employees'), String(client.employees)], [t('sites_shifts'), `${client.sites} / ${client.shifts}`],
            [t('integrated_audit'), client.is_integrated ? `${t('yes')} (MD11)` : t('no')],
            [t('iaf_codes'), client.iaf_codes.join(', ')], [t('risk_level'), client.risk_level],
            [t('accreditation'), client.accreditation], [t('issue_date'), client.cert_issue_date],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between gap-4 border-b border-surface-border/60 pb-2 dark:border-navy-600">
              <span className="text-navy-400">{k}</span>
              <span className="font-semibold text-navy-700">{v || '—'}</span>
            </div>
          ))}
          <div className="md:col-span-2">
            <p className="mb-1 text-navy-400">{t('scope')}</p>
            <p className="rounded-lg bg-surface-gray p-3 leading-relaxed text-navy-700 dark:bg-navy-900">{client.scope ?? '—'}</p>
          </div>
          {client.exclusions && (
            <div className="md:col-span-2">
              <p className="mb-1 text-navy-400">{t('exclusions')}</p>
              <p className="rounded-lg bg-gold-50 p-3 text-navy-700 dark:bg-navy-700">{client.exclusions}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'audits' && (
        <div className="space-y-3 animate-fade-up">
          {audits.length === 0 && <EmptyState title={t('no_audits_yet')} />}
          {audits.map((a) => (
            <Link key={a.id} href={`/audits/${a.id}`} className="card card-hover flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className={`rounded-lg px-3 py-1.5 text-sm font-bold ${a.status === 'completed' ? 'bg-green-50 text-status-green' : 'bg-gold-50 text-gold-600'}`}>
                  {tAuditType(a.audit_type)}
                </span>
                <div>
                  <p className="font-inter text-sm font-semibold text-navy-700" dir="ltr">{a.start_date} {a.end_date && a.end_date !== a.start_date ? `→ ${a.end_date}` : ''}</p>
                  <p className="text-xs text-navy-400">{a.status === 'completed' ? t('completed') : t('planned')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-navy-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.auditors?.color ?? '#2E5FA3' }} aria-hidden />
                {a.auditors?.name ?? '—'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'forms' && (
        <div className="animate-fade-up space-y-3">
          <div className="flex justify-end">
            <Link href={`/forms?client=${client.id}`} className="btn-primary"><FileText className="h-4 w-4" /> {t('generate_new_form')}</Link>
          </div>
          {forms.length === 0 ? (
            <EmptyState title={t('no_forms_client')} action={<Link href={`/forms?client=${client.id}`} className="btn-primary">{t('open_forms_center')}</Link>} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {forms.map((f) => {
                const def = FORM_LIST.find((d) => d.code === f.form_code);
                return (
                  <Link key={f.id} href={`/forms/${f.form_code}?client=${client.id}`} className="card card-hover p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-inter text-xs font-bold text-gold-600">ISO-{f.form_code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${f.status === 'printed' ? 'bg-green-50 text-status-green' : f.status === 'completed' ? 'bg-navy-50 text-navy-600' : 'bg-gold-50 text-gold-600'}`}>
                        {f.status === 'printed' ? t('printed') : f.status === 'completed' ? t('completed') : t('draft')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-navy-700">{def ? (lang === 'ar' ? def.title_ar : def.title_en) : f.form_code}</p>
                    <p className="mt-1 font-inter text-[10px] text-navy-400" dir="ltr">{new Date(f.created_at).toISOString().slice(0, 10)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'files' && (
        <div className="animate-fade-up space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { uploadKind.current = 'site_photo'; fileRef.current?.click(); }} className="btn-primary" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {t('upload_site_photo')}
            </button>
            <button onClick={() => { uploadKind.current = 'audit_file'; fileRef.current?.click(); }} className="btn-outline" disabled={uploading}>
              <FileArchive className="h-4 w-4" /> {t('attach_audit_file')}
            </button>
            <input ref={fileRef} type="file" hidden onChange={onUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />
          </div>

          {attachments.length === 0 ? (
            <EmptyState title={t('client_file_empty')} hint={t('upload_hint')} action={<button onClick={() => { uploadKind.current = 'site_photo'; fileRef.current?.click(); }} className="btn-primary"><Upload className="h-4 w-4" /> {t('upload_first')}</button>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {attachments.map((att) => (
                <div key={att.id} className="card group overflow-hidden">
                  {att.mime_type?.startsWith('image/') ? (
                    <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="relative block h-32 w-full bg-surface-gray">
                      <Image src={publicUrl(att.storage_path)} alt={att.name} fill className="object-cover" unoptimized />
                    </a>
                  ) : (
                    <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="flex h-32 flex-col items-center justify-center gap-2 bg-surface-gray text-navy-300 dark:bg-navy-900">
                      <FileArchive className="h-10 w-10" />
                      <span className="text-[10px] font-bold">{att.name.split('.').pop()?.toUpperCase()}</span>
                    </a>
                  )}
                  <div className="flex items-center justify-between gap-1 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-navy-700" title={att.name}>{att.name}</p>
                      <p className="text-[10px] text-navy-400">{kindLabel(att.kind)}</p>
                    </div>
                    <div className="flex shrink-0">
                      <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="rounded p-1 text-navy-400 hover:text-navy-700" aria-label={att.name}><ExternalLink className="h-3.5 w-3.5" /></a>
                      <button onClick={() => deleteAttachment(att)} className="rounded p-1 text-navy-400 hover:text-status-red" aria-label={`${t('delete')} ${att.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'nc' && (
        <div className="animate-fade-up space-y-3">
          {ncs.length === 0 && <EmptyState title={t('no_ncs')} hint={t('clean_record')} />}
          {ncs.map((n) => (
            <div key={n.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <NCBadge type={n.nc_type} />
                  <span className="font-inter text-sm font-bold text-navy-700">{n.nc_number}</span>
                  <span className="text-xs text-navy-400">{n.standard_code} · {t('clause')} {n.clause}</span>
                </div>
                <NCStatusBadge status={n.status} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{n.description}</p>
              {n.deadline && <p className="mt-2 text-xs text-navy-400">{t('deadline')}: <span dir="ltr" className="font-inter font-bold">{n.deadline}</span>{n.closed_date && <> · {t('closed_on')}: <span dir="ltr" className="font-inter">{n.closed_date}</span></>}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'log' && (
        <div className="card animate-fade-up p-6">
          <ol className="relative space-y-5 border-s-2 border-surface-border ps-5 dark:border-navy-600">
            {activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -start-[25px] top-1 h-3 w-3 rounded-full bg-gold ring-4 ring-gold-50 dark:ring-navy-800" aria-hidden />
                <p className="text-sm font-semibold text-navy-700">{a.description_ar}</p>
                <p className="text-[11px] text-navy-400">{a.actor} · <span dir="ltr" className="font-inter">{new Date(a.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-GB')}</span></p>
              </li>
            ))}
            {activity.length === 0 && <p className="text-sm text-navy-400">{t('no_logs')}</p>}
          </ol>
        </div>
      )}
    </div>
  );
}
