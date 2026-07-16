'use client';
import { useCallback, useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, Save, Wand2, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { FORM_DEFINITIONS, type FormContext, type FormDefinition } from '@/lib/forms/definitions';
import { Skeleton } from '@/components/ui/core';
import { useLang } from '@/lib/i18n';
import type { Audit, AuditCalculation, Client, NonConformity } from '@/lib/types';

function FormViewer() {
  const { code } = useParams<{ code: string }>();
  const params = useSearchParams();
  const { t, lang } = useLang();
  const def: FormDefinition | undefined = FORM_DEFINITIONS.find((d) => d.code === code);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState(params.get('client') ?? '');
  const [ctx, setCtx] = useState<FormContext>({ client: null, calc: null, audits: [], ncs: [] });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filling, setFilling] = useState(false);

  useEffect(() => {
    createClient().from('clients').select('*').order('name').then(({ data }) => setClients((data as Client[]) ?? []));
  }, []);

  const loadContext = useCallback(async (cid: string) => {
    if (!cid) { setCtx({ client: null, calc: null, audits: [], ncs: [] }); return; }
    const supabase = createClient();
    const [c, calc, audits, ncs, existing] = await Promise.all([
      supabase.from('clients').select('*').eq('id', cid).single(),
      supabase.from('audit_calculations').select('*').eq('client_id', cid).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('audits').select('*, auditors(id, name, color)').eq('client_id', cid).order('start_date'),
      supabase.from('non_conformities').select('*').eq('client_id', cid),
      supabase.from('forms_generated').select('*').eq('client_id', cid).eq('form_code', code).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setCtx({
      client: c.data as Client,
      calc: calc.data as AuditCalculation | null,
      audits: (audits.data as Audit[]) ?? [],
      ncs: (ncs.data as NonConformity[]) ?? [],
    });
    setValues(((existing.data?.form_data ?? {}) as Record<string, string>));
  }, [code]);

  useEffect(() => { loadContext(clientId); }, [clientId, loadContext]);

  if (!def) return <p className="text-navy-400">{t('unknown_form')}</p>;

  function fieldValue(key: string, auto?: (c: FormContext) => string): string {
    if (key in values) return values[key];
    if (auto && ctx.client) return auto(ctx);
    return '';
  }

  function autoFillAll() {
    if (!ctx.client) return;
    setFilling(true);
    const next: Record<string, string> = { ...values };
    def!.sections.forEach((s) =>
      s.fields.forEach((f) => {
        if (f.auto) next[f.key] = f.auto(ctx);
      })
    );
    setValues(next);
    setTimeout(() => setFilling(false), 400);
  }

  async function save(status: 'completed' | 'printed' = 'completed') {
    if (!clientId) return;
    setSaving(true);
    const supabase = createClient();
    const data: Record<string, string> = {};
    def!.sections.forEach((s) => s.fields.forEach((f) => { data[f.key] = fieldValue(f.key, f.auto); }));
    const { data: existing } = await supabase.from('forms_generated').select('id').eq('client_id', clientId).eq('form_code', code).limit(1).maybeSingle();
    if (existing) {
      await supabase.from('forms_generated').update({ form_data: data, status, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('forms_generated').insert({ client_id: clientId, form_code: code, form_data: data, status });
    }
    await supabase.from('activity_log').insert({
      entity: 'form', client_id: clientId, action: status === 'printed' ? 'print' : 'generate',
      description_ar: `${status === 'printed' ? 'Print' : 'Save'} ISO-${code} for ${ctx.client?.name}`, actor: 'admin',
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function printPdf() {
    await save('printed');
    window.print();
  }

  const isCertificate = code === 'F06-14';

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="no-print card flex flex-wrap items-center gap-3 p-3">
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="input w-64" aria-label={t('client')}>
          <option value="">{t('select_client')}</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span className="text-xs text-navy-400" dir="ltr">{new Date().toISOString().slice(0, 10)}</span>
        <div className="ms-auto flex gap-2">
          <button onClick={autoFillAll} disabled={!ctx.client || filling} className="btn-gold">
            {filling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} {t('auto_fill')}
          </button>
          <button onClick={() => save('completed')} disabled={!clientId || saving} className="btn-outline">
            {saved ? <Check className="h-4 w-4 text-status-green" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saved ? t('saved') : t('save')}
          </button>
          <button onClick={printPdf} disabled={!clientId} className="btn-primary">
            <Printer className="h-4 w-4" /> {t('print_pdf')}
          </button>
        </div>
      </div>

      {/* المستند الرسمي — يبقى LTR إنجليزي مطابق للأصل مع ترويسة ثنائية */}
      <div className={`print-area card form-doc mx-auto max-w-4xl p-8 ${isCertificate ? 'border-4 border-double border-gold' : ''}`} dir="ltr">
        <div className="mb-6 flex items-center justify-between border-b-2 border-navy-700 pb-4">
          <Image src="/logo.jpg" alt="ISO CERT INTERNATIONAL" width={72} height={72} className="rounded-full" />
          <div className="text-center">
            <h1 className="text-lg font-bold text-navy-800">ISO CERT INTERNATIONAL</h1>
            <p className="text-sm font-semibold text-navy-500">{def.title_en}</p>
            <p className="text-xs text-navy-400">{def.title_ar}</p>
          </div>
          <div className="text-right font-inter text-xs text-navy-500">
            <p className="font-bold">ISO-{def.code}</p>
            <p>{def.rev}</p>
          </div>
        </div>

        {!ctx.client && (
          <p className="no-print mb-4 rounded-lg bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-600" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            {t('form_yellow_hint')}
          </p>
        )}

        {isCertificate && ctx.client ? (
          /* عرض الشهادة بتصميم مميز */
          <div className="space-y-6 py-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-navy-400">Certificate of Registration</p>
            <p className="text-sm text-navy-500">This is to certify that</p>
            <input
              className="form-field-yellow mx-auto block w-3/4 text-center text-2xl font-bold"
              value={fieldValue('org_name', def.sections[0].fields.find((f) => f.key === 'org_name')?.auto)}
              onChange={(e) => setValues((v) => ({ ...v, org_name: e.target.value }))}
              aria-label="Organization name"
            />
            <textarea
              className="form-field-yellow mx-auto block w-3/4 resize-none text-center text-sm"
              rows={2}
              value={fieldValue('address', def.sections[0].fields.find((f) => f.key === 'address')?.auto)}
              onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
              aria-label="Address"
            />
            <p className="text-sm text-navy-500">has been assessed and registered against the requirements of</p>
            <input
              className="form-field-yellow mx-auto block w-2/3 text-center text-lg font-bold"
              value={fieldValue('standards', def.sections[0].fields.find((f) => f.key === 'standards')?.auto)}
              onChange={(e) => setValues((v) => ({ ...v, standards: e.target.value }))}
              aria-label="Standards"
            />
            <p className="text-sm text-navy-500">for the following scope of activities</p>
            <textarea
              className="form-field-yellow mx-auto block w-5/6 resize-none text-center text-sm"
              rows={3}
              value={fieldValue('scope', def.sections[0].fields.find((f) => f.key === 'scope')?.auto)}
              onChange={(e) => setValues((v) => ({ ...v, scope: e.target.value }))}
              aria-label="Scope"
            />
            <div className="mx-auto grid w-5/6 grid-cols-3 gap-4 pt-4 text-sm">
              {(['cert_no', 'issue_date', 'expiry_date'] as const).map((k) => {
                const f = def.sections[0].fields.find((x) => x.key === k)!;
                return (
                  <div key={k}>
                    <p className="mb-1 text-xs font-bold text-navy-500">{k === 'cert_no' ? 'Certificate No.' : k === 'issue_date' ? 'Date of Issue' : 'Valid Until'}</p>
                    <input
                      className="form-field-yellow w-full text-center font-inter font-bold"
                      value={fieldValue(k, f.auto)}
                      onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                      aria-label={f.label}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-end justify-between px-10 pt-8">
              <div className="text-center">
                <p className="mb-8 text-xs text-navy-400">Authorized Signatory</p>
                <p className="border-t border-navy-400 px-8 pt-1 text-xs">ISO CERT INTERNATIONAL</p>
              </div>
              <Image src="/logo.jpg" alt="" width={64} height={64} className="rounded-full opacity-80" />
              <div className="text-center">
                <p className="mb-8 text-xs text-navy-400">Accreditation</p>
                <p className="border-t border-navy-400 px-8 pt-1 font-inter text-xs font-bold">{ctx.client.accreditation}</p>
              </div>
            </div>
          </div>
        ) : (
          def.sections.map((section, si) => (
            <section key={si} className="mb-6">
              {section.title && (
                <h2 className="mb-2 rounded bg-navy-700 px-3 py-1.5 text-sm font-bold text-white">{section.title}</h2>
              )}
              <table>
                <tbody>
                  {section.fields.map((f) => (
                    <tr key={f.key}>
                      <th className="w-1/3">{f.label}</th>
                      <td colSpan={f.span ?? 1}>
                        {f.type === 'textarea' ? (
                          <textarea
                            className="form-field-yellow min-h-20 w-full resize-y text-sm outline-none"
                            value={fieldValue(f.key, f.auto)}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                            aria-label={f.label}
                          />
                        ) : (
                          <input
                            className="form-field-yellow w-full text-sm outline-none"
                            value={fieldValue(f.key, f.auto)}
                            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                            aria-label={f.label}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}

        <footer className="mt-8 flex items-end justify-between border-t border-navy-300 pt-4 text-xs text-navy-500">
          <div>
            <p className="mb-6 font-semibold">{t('signature')}: ______________________</p>
            <p>{t('date')}: <span dir="ltr" className="font-inter">{new Date().toISOString().slice(0, 10)}</span></p>
          </div>
          <p className="font-inter">ISO-{def.code} {def.rev} — iso-cert.uk</p>
        </footer>
      </div>
    </div>
  );
}

export default function FormViewerPage() {
  return <Suspense fallback={<Skeleton className="h-96" />}><FormViewer /></Suspense>;
}
