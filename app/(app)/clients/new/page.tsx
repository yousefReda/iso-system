'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronRight, ChevronLeft, Loader2, Calculator } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STANDARD_CODES } from '@/lib/types';
import { useLang } from '@/lib/i18n';
import type { CalculatorResult } from '@/lib/calculator/audit-calculator';

interface IafOption { code: string; description_ar: string; description_en: string; }
interface IncDecRule { id: string; rule_type: string; description_ar: string; description_en: string; }

export default function NewClientWizard() {
  const router = useRouter();
  const { t, lang, dir } = useLang();
  const [step, setStep] = useState(0);
  const [iafOptions, setIafOptions] = useState<IafOption[]>([]);
  const [incDecRules, setIncDecRules] = useState<IncDecRule[]>([]);
  const [calc, setCalc] = useState<CalculatorResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const STEPS = [t('company_info'), t('standards_codes'), t('review_calc')];

  const [form, setForm] = useState({
    name: '', name_ar: '', address: '', city: '', country: 'Saudi Arabia',
    phone: '', email: '', contact_person: '', position: '',
    employees: 10, sites: 1, shifts: 1, is_integrated: false,
    standards: [] as string[], iaf_codes: [] as string[],
    scope: '', exclusions: '', md5: 0,
    selectedNotes: [] as string[],
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.from('iaf_codes').select('code, description_ar, description_en').order('code').then(({ data }) => setIafOptions((data as IafOption[]) ?? []));
    supabase.from('increase_decrease_rules').select('id, rule_type, description_ar, description_en').then(({ data }) => setIncDecRules((data as IncDecRule[]) ?? []));
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  function toggle(list: 'standards' | 'iaf_codes' | 'selectedNotes', value: string) {
    setForm((f) => ({
      ...f,
      [list]: f[list].includes(value) ? f[list].filter((x) => x !== value) : [...f[list], value],
    }));
    setCalc(null);
  }

  const step1Valid = form.name.trim().length > 1 && form.employees > 0;
  const step2Valid = form.standards.length > 0 && form.iaf_codes.length > 0;
  const BackIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const NextIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  async function runCalc() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees: form.employees, sites: form.sites, isIntegrated: form.is_integrated,
          selectedStandards: form.standards, md5ReductionPercent: form.md5,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'error');
      setCalc(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!calc) return;
    setSaving(true);
    setError('');
    const supabase = createClient();
    const clientNumber = `SA-${String(Math.floor(Math.random() * 900) + 100)}-${new Date().getFullYear()}`;
    const { data: client, error: cErr } = await supabase
      .from('clients')
      .insert({
        client_number: clientNumber, name: form.name, name_ar: form.name_ar || null,
        address: form.address || null, city: form.city || null, country: form.country || null,
        phone: form.phone || null, email: form.email || null,
        contact_person: form.contact_person || null, position: form.position || null,
        employees: form.employees, sites: form.sites, shifts: form.shifts,
        is_integrated: form.is_integrated, standards: form.standards, iaf_codes: form.iaf_codes,
        scope: form.scope || null, exclusions: form.exclusions || null,
        risk_level: calc.riskLevel, status: 'pending',
      })
      .select('id')
      .single();
    if (cErr || !client) {
      setError(cErr?.message ?? 'save failed');
      setSaving(false);
      return;
    }
    await fetch('/api/calculator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employees: form.employees, sites: form.sites, isIntegrated: form.is_integrated,
        selectedStandards: form.standards, md5ReductionPercent: form.md5,
        clientId: client.id, save: true,
        increaseDecreaseNotes: form.selectedNotes.map((id) => ({ ruleId: id })),
      }),
    });
    await supabase.from('activity_log').insert({
      entity: 'client', entity_id: client.id, client_id: client.id,
      action: 'create', description_ar: `New client registered: ${form.name}`, actor: 'admin',
    });
    router.push(`/clients/${client.id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-navy-800">{t('new_client')}</h1>

      <div className="card flex items-center p-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i < step ? 'bg-status-green text-white' : i === step ? 'bg-gold text-navy-900 ring-4 ring-gold-50' : 'bg-navy-100 text-navy-400 dark:bg-navy-700'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm font-semibold sm:block ${i === step ? 'text-navy-800' : 'text-navy-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`mx-3 h-0.5 flex-1 ${i < step ? 'bg-status-green' : 'bg-navy-100 dark:bg-navy-700'}`} aria-hidden />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 animate-fade-up">
          <div className="sm:col-span-2"><label className="label">{t('company_name_en')}</label><input className="input font-inter" dir="ltr" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="COMPANY NAME LLC" /></div>
          <div><label className="label">{t('company_name_ar')}</label><input className="input" dir="rtl" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} /></div>
          <div><label className="label">{t('contact_person')}</label><input className="input" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></div>
          <div><label className="label">{t('position')}</label><input className="input" value={form.position} onChange={(e) => set('position', e.target.value)} /></div>
          <div><label className="label">{t('email')}</label><input type="email" dir="ltr" className="input font-inter" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div><label className="label">{t('phone')}</label><input dir="ltr" className="input font-inter" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div><label className="label">{t('city')}</label><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">{t('address')}</label><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div><label className="label">{t('employees_req')}</label><input type="number" min={1} className="input font-inter" value={form.employees} onChange={(e) => { set('employees', Number(e.target.value)); setCalc(null); }} /></div>
          <div><label className="label">{t('sites_count')}</label><input type="number" min={1} className="input font-inter" value={form.sites} onChange={(e) => set('sites', Number(e.target.value))} /></div>
          <div><label className="label">{t('shifts_count')}</label><input type="number" min={1} className="input font-inter" value={form.shifts} onChange={(e) => set('shifts', Number(e.target.value))} /></div>
          <div className="sm:col-span-2"><label className="label">{t('scope')}</label><textarea className="input min-h-20" value={form.scope} onChange={(e) => set('scope', e.target.value)} /></div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5 animate-fade-up">
          <div className="card p-6">
            <h3 className="mb-3 font-bold text-navy-700">{t('required_standards')}</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {STANDARD_CODES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle('standards', s)}
                  aria-pressed={form.standards.includes(s)}
                  className={`rounded-xl border-2 p-3 text-start ${form.standards.includes(s) ? 'border-gold bg-gold-50 dark:bg-navy-700' : 'border-surface-border hover:border-navy-300 dark:border-navy-600'}`}
                >
                  <p className="font-inter font-bold text-navy-700">{s}</p>
                  <p className="text-[11px] text-navy-400">{s === 'ISO 13485' ? 'IAF MD 9' : s === 'ISO 50001' ? 'ISO 50003' : 'IAF MD 5'}</p>
                </button>
              ))}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-600">
              <input type="checkbox" checked={form.is_integrated} onChange={(e) => { set('is_integrated', e.target.checked); setCalc(null); }} className="h-4 w-4 accent-gold" />
              {t('integrated_hint')}
            </label>
          </div>

          <div className="card p-6">
            <h3 className="mb-3 font-bold text-navy-700">{t('iaf_codes')} *</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {iafOptions.map((o) => (
                <label key={o.code} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${form.iaf_codes.includes(o.code) ? 'border-gold bg-gold-50 dark:bg-navy-700' : 'border-surface-border dark:border-navy-600'}`}>
                  <input type="checkbox" checked={form.iaf_codes.includes(o.code)} onChange={() => toggle('iaf_codes', o.code)} className="h-4 w-4 accent-gold" />
                  <span className="font-inter font-bold text-navy-600">{o.code}</span>
                  <span className="text-navy-500">{lang === 'ar' ? o.description_ar : o.description_en}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-1 font-bold text-navy-700">{t('inc_dec_factors')}</h3>
            <p className="mb-3 text-xs text-navy-400">{t('inc_dec_hint')}</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {incDecRules.map((r) => (
                <label key={r.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-surface-border px-3 py-2 text-xs dark:border-navy-600">
                  <input type="checkbox" checked={form.selectedNotes.includes(r.id)} onChange={() => toggle('selectedNotes', r.id)} className="mt-0.5 h-3.5 w-3.5 accent-gold" />
                  <span>
                    <span className={`me-1 rounded px-1 font-bold ${r.rule_type === 'increase' ? 'bg-red-50 text-status-red' : 'bg-green-50 text-status-green'}`}>{r.rule_type === 'increase' ? t('increase') : t('decrease')}</span>
                    {lang === 'ar' ? r.description_ar : r.description_en}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 max-w-xs">
              <label className="label">{t('md5_input')}</label>
              <input type="number" min={0} max={20} step={0.1} className="input font-inter" value={form.md5} onChange={(e) => { set('md5', Number(e.target.value)); setCalc(null); }} />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5 animate-fade-up">
          <div className="card p-6">
            <h3 className="mb-3 font-bold text-navy-700">{t('review_data')}</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
              <div><dt className="text-navy-400">{t('company')}</dt><dd className="font-bold text-navy-700">{form.name}</dd></div>
              <div><dt className="text-navy-400">{t('employees')}</dt><dd className="font-inter font-bold text-navy-700">{form.employees}</dd></div>
              <div><dt className="text-navy-400">{t('sites_shifts')}</dt><dd className="font-inter font-bold text-navy-700">{form.sites} / {form.shifts}</dd></div>
              <div><dt className="text-navy-400">{t('standards')}</dt><dd className="font-bold text-navy-700">{form.standards.join(', ')}</dd></div>
              <div><dt className="text-navy-400">{t('iaf_codes')}</dt><dd className="font-inter font-bold text-navy-700">{form.iaf_codes.join(', ')}</dd></div>
              <div><dt className="text-navy-400">{t('integrated')}</dt><dd className="font-bold text-navy-700">{form.is_integrated ? t('yes') : t('no')}</dd></div>
            </dl>
          </div>

          <div className="card border-2 border-gold/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-navy-700">{t('audit_days_calc')}</h3>
              <button onClick={runCalc} disabled={busy} className="btn-primary">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} {t('calculate')}
              </button>
            </div>
            {calc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                  <div className="rounded-xl bg-surface-gray p-3 dark:bg-navy-900"><p className="text-xs text-navy-400">{t('before_reductions')}</p><p className="text-2xl font-bold text-navy-700">{calc.totalBeforeReduction}</p></div>
                  <div className="rounded-xl bg-surface-gray p-3 dark:bg-navy-900"><p className="text-xs text-navy-400">{t('total_reduction')}</p><p className="text-2xl font-bold text-status-red">{calc.totalReductionPercent}%</p></div>
                  <div className="rounded-xl bg-gold-50 p-3 dark:bg-navy-700"><p className="text-xs text-navy-500">{t('final_days')}</p><p className="text-2xl font-bold text-gold-600">{calc.roundedFinalAuditDays}</p></div>
                  <div className="rounded-xl bg-surface-gray p-3 dark:bg-navy-900"><p className="text-xs text-navy-400">{t('risk_level')}</p><p className="text-2xl font-bold text-navy-700">{calc.riskLevel}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                  {[[t('stage1'), calc.stage1Days], [t('stage2'), calc.stage2Days], [t('surveillance'), calc.surveillanceDays], [t('recert'), calc.recertDays]].map(([l, v]) => (
                    <div key={l as string} className="rounded-xl border border-surface-border p-3 dark:border-navy-600"><p className="text-xs text-navy-400">{l}</p><p className="text-xl font-bold text-navy-700">{v} {t('day')}</p></div>
                  ))}
                </div>
                <p className="text-xs text-navy-400" dir="ltr">MD5 {calc.md5ReductionPercent}% · MD9 {calc.md9ReductionPercent}% · MD11 {calc.md11ReductionPercent}%</p>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-navy-400">{t('press_calculate')}</p>
            )}
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-status-red">{error}</p>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-outline">
          <BackIcon className="h-4 w-4" /> {t('back')}
        </button>
        {step < 2 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={(step === 0 && !step1Valid) || (step === 1 && !step2Valid)}
            className="btn-primary"
          >
            {t('next')} <NextIcon className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={save} disabled={!calc || saving} className="btn-gold">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t('save_client')}
          </button>
        )}
      </div>
    </div>
  );
}
