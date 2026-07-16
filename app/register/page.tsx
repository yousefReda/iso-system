'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STANDARD_CODES } from '@/lib/types';
import { useLang } from '@/lib/i18n';

interface IafOption { code: string; description_en: string; description_ar: string; }

export default function PublicRegisterPage() {
  const { t, lang, setLang } = useLang();
  const [iafOptions, setIafOptions] = useState<IafOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', contact_person: '', position: '', email: '', phone: '',
    city: '', country: '', address: '', employees: 10, sites: 1, shifts: 1,
    standards: [] as string[], iaf: '', scope: '', is_integrated: false,
  });

  useEffect(() => {
    createClient().from('iaf_codes').select('code, description_en, description_ar').order('code')
      .then(({ data }) => setIafOptions((data as IafOption[]) ?? []));
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.standards.length === 0 || !form.iaf) {
      setError(lang === 'ar' ? 'اختر مواصفة واحدة على الأقل والنشاط الرئيسي' : 'Select at least one standard and the main activity');
      return;
    }
    setBusy(true);
    setError('');
    const supabase = createClient();
    const ref = `APP-${Date.now().toString().slice(-6)}`;
    const { error: insErr } = await supabase.from('clients').insert({
      client_number: ref,
      name: form.name,
      contact_person: form.contact_person || null,
      position: form.position || null,
      email: form.email || null,
      phone: form.phone || null,
      city: form.city || null,
      country: form.country || null,
      address: form.address || null,
      employees: form.employees,
      sites: form.sites,
      shifts: form.shifts,
      is_integrated: form.is_integrated,
      standards: form.standards,
      iaf_codes: [form.iaf],
      scope: form.scope || null,
      status: 'pending',
      notes: 'Submitted via public application form',
    });
    if (insErr) {
      setError(insErr.message);
      setBusy(false);
      return;
    }
    await supabase.from('notifications').insert({
      title_ar: lang === 'ar' ? `طلب اعتماد جديد: ${form.name}` : `New certification application: ${form.name}`,
      body_ar: `${ref} — ${form.standards.join(', ')}`,
      kind: 'info',
      link: '/clients',
    });
    await supabase.from('activity_log').insert({
      entity: 'client', action: 'apply',
      description_ar: `New public application ${ref}: ${form.name}`,
      actor: form.contact_person || 'public form',
    });
    setRefNumber(ref);
    setBusy(false);
  }

  if (refNumber) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-700 via-navy-600 to-navy-500 p-4">
        <div className="card w-full max-w-md animate-fade-up p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-status-green" />
          <h1 className="mt-4 text-xl font-bold text-navy-700">{t('register_success')}</h1>
          <p className="mt-3 text-sm text-navy-400">{t('register_ref')}</p>
          <p className="font-inter text-2xl font-bold text-gold-600" dir="ltr">{refNumber}</p>
          <Link href="/login" className="btn-primary mt-6 w-full">{t('back_to_login')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-700 via-navy-600 to-navy-500 p-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex justify-end">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20">
            {t('toggle_lang')}
          </button>
        </div>
        <div className="card p-8">
          <div className="mb-6 flex items-center gap-4">
            <Image src="/logo.jpg" alt="ISO CERT INTERNATIONAL" width={64} height={64} className="rounded-full shadow-card" priority />
            <div>
              <h1 className="text-xl font-bold text-navy-700">{t('register_title')}</h1>
              <p className="font-inter text-xs text-navy-400">{t('register_sub')}</p>
            </div>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label">{t('entity_name')}</label><input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="label">{t('contact_person')}</label><input required className="input" value={form.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></div>
            <div><label className="label">{t('position')}</label><input className="input" value={form.position} onChange={(e) => set('position', e.target.value)} /></div>
            <div><label className="label">{t('email')}</label><input required type="email" dir="ltr" className="input font-inter" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
            <div><label className="label">{t('phone')}</label><input required dir="ltr" className="input font-inter" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><label className="label">{t('city')}</label><input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
            <div><label className="label">Country</label><input className="input" value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
            <div className="sm:col-span-2"><label className="label">{t('address')}</label><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div><label className="label">{t('employees_req')}</label><input required type="number" min={1} className="input font-inter" value={form.employees} onChange={(e) => set('employees', Number(e.target.value))} /></div>
            <div><label className="label">{t('sites_count')}</label><input type="number" min={1} className="input font-inter" value={form.sites} onChange={(e) => set('sites', Number(e.target.value))} /></div>

            <div className="sm:col-span-2">
              <p className="label">{t('required_standards')}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STANDARD_CODES.map((s) => (
                  <label key={s} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-inter font-bold ${form.standards.includes(s) ? 'border-gold bg-gold-50 text-navy-700' : 'border-surface-border text-navy-500'}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-gold"
                      checked={form.standards.includes(s)}
                      onChange={() => set('standards', form.standards.includes(s) ? form.standards.filter((x) => x !== s) : [...form.standards, s])}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="label">{t('main_activity')}</label>
              <select required className="input" value={form.iaf} onChange={(e) => set('iaf', e.target.value)}>
                <option value="">{t('select')}</option>
                {iafOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code} — {lang === 'ar' ? o.description_ar : o.description_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2"><label className="label">{t('activities_desc')}</label><textarea required className="input min-h-24" value={form.scope} onChange={(e) => set('scope', e.target.value)} /></div>

            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-status-red sm:col-span-2">{error}</p>}

            <div className="flex items-center justify-between sm:col-span-2">
              <Link href="/login" className="text-sm text-navy-400 hover:underline">{t('back_to_login')}</Link>
              <button type="submit" className="btn-gold" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {t('submit_application')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
