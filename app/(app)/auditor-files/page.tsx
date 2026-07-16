'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderCog, Upload, FileArchive, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EmptyState, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Auditor } from '@/lib/types';

interface AuditorFile { id: string; auditor_id: string; kind: string; name: string; storage_path: string; mime_type: string | null; }

export default function AuditorFilesPage() {
  const { t } = useLang();
  const [auditors, setAuditors] = useState<Auditor[] | null>(null);
  const [files, setFiles] = useState<AuditorFile[]>([]);
  const [selected, setSelected] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef({ auditorId: '', kind: 'document' });

  const load = useCallback(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('auditors').select('*').eq('is_active', true).order('name'),
      supabase.from('auditor_attachments').select('*').order('created_at', { ascending: false }),
    ]).then(([a, f]) => {
      setAuditors((a.data as Auditor[]) ?? []);
      setFiles((f.data as AuditorFile[]) ?? []);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  function publicUrl(path: string) {
    return createClient().storage.from('client-files').getPublicUrl(path).data.publicUrl;
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const { auditorId, kind } = target.current;
    if (!file || !auditorId) return;
    setUploading(true);
    const supabase = createClient();
    const path = `auditors/${auditorId}/${kind}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from('client-files').upload(path, file);
    if (!error) {
      await supabase.from('auditor_attachments').insert({
        auditor_id: auditorId, kind, name: file.name,
        storage_path: path, mime_type: file.type, size_bytes: file.size,
      });
      load();
    }
    setUploading(false);
    e.target.value = '';
  }

  async function remove(f: AuditorFile) {
    if (!confirm(`${t('delete')} "${f.name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from('client-files').remove([f.storage_path]);
    await supabase.from('auditor_attachments').delete().eq('id', f.id);
    load();
  }

  if (!auditors) return <Skeleton className="h-96" />;
  const shown = selected ? auditors.filter((a) => a.id === selected) : auditors;
  const KINDS = [
    { key: 'cv', label: t('cv') },
    { key: 'certificate', label: t('certificate_doc') },
    { key: 'contract', label: t('contract') },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('auditor_files')}</h1>
          <p className="text-sm text-navy-400">{t('auditor_files_sub')}</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input w-64" aria-label={t('auditor')}>
          <option value="">{t('all')}</option>
          {auditors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
      <input ref={fileRef} type="file" hidden onChange={onUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

      <div className="space-y-4">
        {shown.map((auditor) => {
          const afiles = files.filter((f) => f.auditor_id === auditor.id);
          return (
            <div key={auditor.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: auditor.color }} aria-hidden />
                  <p className="font-bold text-navy-700">{auditor.name}</p>
                  <span className="rounded bg-navy-50 px-2 py-0.5 text-[10px] font-bold text-navy-500 dark:bg-navy-700 dark:text-navy-100">
                    {auditor.role === 'lead_auditor' ? t('lead_auditor_role') : auditor.role === 'technical_expert' ? t('technical_expert') : auditor.role === 'reviewer' ? t('reviewer') : t('auditor_role')}
                  </span>
                  <span className="rounded-full bg-surface-gray px-2 py-0.5 text-xs font-bold text-navy-500 dark:bg-navy-900">{afiles.length}</span>
                </div>
                <div className="flex gap-1.5">
                  {KINDS.map((k) => (
                    <button
                      key={k.key}
                      onClick={() => { target.current = { auditorId: auditor.id, kind: k.key }; fileRef.current?.click(); }}
                      className="btn-outline py-1 text-[11px]"
                      disabled={uploading}
                    >
                      {uploading && target.current.auditorId === auditor.id && target.current.kind === k.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} {k.label}
                    </button>
                  ))}
                </div>
              </div>
              {afiles.length === 0 ? (
                <p className="rounded-lg border border-dashed border-surface-border py-4 text-center text-xs text-navy-300 dark:border-navy-600">{t('no_files')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {afiles.map((f) => (
                    <div key={f.id} className="overflow-hidden rounded-lg border border-surface-border dark:border-navy-600">
                      <a href={publicUrl(f.storage_path)} target="_blank" rel="noreferrer" className="flex h-16 flex-col items-center justify-center gap-1 bg-surface-gray text-navy-300 dark:bg-navy-900">
                        <FileArchive className="h-6 w-6" />
                        <span className="text-[9px] font-bold uppercase">{KINDS.find((k) => k.key === f.kind)?.label ?? f.kind}</span>
                      </a>
                      <div className="flex items-center justify-between gap-1 p-1.5">
                        <p className="truncate text-[10px] font-bold text-navy-700" title={f.name}>{f.name}</p>
                        <div className="flex shrink-0">
                          <a href={publicUrl(f.storage_path)} target="_blank" rel="noreferrer" className="rounded p-0.5 text-navy-400 hover:text-navy-700" aria-label={f.name}><ExternalLink className="h-3 w-3" /></a>
                          <button onClick={() => remove(f)} className="rounded p-0.5 text-navy-400 hover:text-status-red" aria-label={`${t('delete')} ${f.name}`}><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <EmptyState title={t('no_files')} icon={<FolderCog className="h-10 w-10" />} />}
      </div>
    </div>
  );
}
