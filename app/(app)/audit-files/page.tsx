'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen, Upload, FileArchive, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { EmptyState, Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Client } from '@/lib/types';

interface Attachment { id: string; client_id: string; kind: string; name: string; storage_path: string; mime_type: string | null; }

export default function AuditFilesPage() {
  const { t } = useLang();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selected, setSelected] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetClient = useRef('');

  const load = useCallback(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('client_attachments').select('*').order('created_at', { ascending: false }),
    ]).then(([c, a]) => {
      setClients((c.data as Client[]) ?? []);
      setAttachments((a.data as Attachment[]) ?? []);
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  function publicUrl(path: string) {
    return createClient().storage.from('client-files').getPublicUrl(path).data.publicUrl;
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const clientId = targetClient.current;
    if (!file || !clientId) return;
    setUploading(true);
    const supabase = createClient();
    const path = `clients/${clientId}/audit_file/${Date.now()}_${file.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from('client-files').upload(path, file);
    if (!error) {
      await supabase.from('client_attachments').insert({
        client_id: clientId, kind: 'audit_file', name: file.name,
        storage_path: path, mime_type: file.type, size_bytes: file.size,
      });
      load();
    }
    setUploading(false);
    e.target.value = '';
  }

  async function remove(att: Attachment) {
    if (!confirm(`${t('delete')} "${att.name}"?`)) return;
    const supabase = createClient();
    await supabase.storage.from('client-files').remove([att.storage_path]);
    await supabase.from('client_attachments').delete().eq('id', att.id);
    load();
  }

  if (!clients) return <Skeleton className="h-96" />;
  const shown = selected ? clients.filter((c) => c.id === selected) : clients;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">{t('audit_files')}</h1>
          <p className="text-sm text-navy-400">{t('audit_files_sub')}</p>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="input w-64" aria-label={t('client')}>
          <option value="">{t('all')}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input ref={fileRef} type="file" hidden onChange={onUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

      <div className="space-y-4">
        {shown.map((client) => {
          const files = attachments.filter((a) => a.client_id === client.id);
          return (
            <div key={client.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-gold" aria-hidden />
                  <Link href={`/clients/${client.id}`} className="font-bold text-navy-700 hover:text-gold-600">{client.name}</Link>
                  <span className="rounded-full bg-surface-gray px-2 py-0.5 text-xs font-bold text-navy-500 dark:bg-navy-900">{files.length}</span>
                </div>
                <button
                  onClick={() => { targetClient.current = client.id; fileRef.current?.click(); }}
                  className="btn-outline py-1.5 text-xs"
                  disabled={uploading}
                >
                  {uploading && targetClient.current === client.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} {t('upload_file')}
                </button>
              </div>
              {files.length === 0 ? (
                <p className="rounded-lg border border-dashed border-surface-border py-4 text-center text-xs text-navy-300 dark:border-navy-600">{t('no_files')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {files.map((att) => (
                    <div key={att.id} className="group overflow-hidden rounded-lg border border-surface-border dark:border-navy-600">
                      {att.mime_type?.startsWith('image/') ? (
                        <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="relative block h-20 w-full bg-surface-gray">
                          <Image src={publicUrl(att.storage_path)} alt={att.name} fill className="object-cover" unoptimized />
                        </a>
                      ) : (
                        <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="flex h-20 flex-col items-center justify-center gap-1 bg-surface-gray text-navy-300 dark:bg-navy-900">
                          <FileArchive className="h-7 w-7" />
                          <span className="text-[9px] font-bold">{att.name.split('.').pop()?.toUpperCase()}</span>
                        </a>
                      )}
                      <div className="flex items-center justify-between gap-1 p-1.5">
                        <p className="truncate text-[10px] font-bold text-navy-700" title={att.name}>{att.name}</p>
                        <div className="flex shrink-0">
                          <a href={publicUrl(att.storage_path)} target="_blank" rel="noreferrer" className="rounded p-0.5 text-navy-400 hover:text-navy-700" aria-label={att.name}><ExternalLink className="h-3 w-3" /></a>
                          <button onClick={() => remove(att)} className="rounded p-0.5 text-navy-400 hover:text-status-red" aria-label={`${t('delete')} ${att.name}`}><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <EmptyState title={t('no_matching_clients')} />}
      </div>
    </div>
  );
}
