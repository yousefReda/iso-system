'use client';
import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { STANDARD_CODES } from '@/lib/types';
import { useLang } from '@/lib/i18n';
import type { CalculatorResult } from '@/lib/calculator/audit-calculator';

export default function CalculatorPage() {
  const { t } = useLang();
  const [employees, setEmployees] = useState(10);
  const [sites, setSites] = useState(1);
  const [isIntegrated, setIsIntegrated] = useState(true);
  const [standards, setStandards] = useState<string[]>(['ISO 9001']);
  const [md5, setMd5] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [error, setError] = useState('');

  function toggleStandard(s: string) {
    setStandards((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
    setResult(null);
  }

  async function calc() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees, sites, isIntegrated, selectedStandards: standards, md5ReductionPercent: md5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'error');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('calculator')}</h1>
        <p className="text-sm text-navy-400" dir="ltr">IAF MD5 / MD9 / MD11</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 font-bold text-navy-700">{t('company_info')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div><label className="label">{t('employees')}</label><input type="number" min={1} className="input font-inter" value={employees} onChange={(e) => { setEmployees(Number(e.target.value)); setResult(null); }} /></div>
              <div><label className="label">{t('sites_count')}</label><input type="number" min={1} className="input font-inter" value={sites} onChange={(e) => setSites(Number(e.target.value))} /></div>
              <div><label className="label">{t('md5_input')}</label><input type="number" min={0} max={20} step={0.1} className="input font-inter" value={md5} onChange={(e) => { setMd5(Number(e.target.value)); setResult(null); }} /></div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-600">
              <input type="checkbox" checked={isIntegrated} onChange={(e) => { setIsIntegrated(e.target.checked); setResult(null); }} className="h-4 w-4 accent-gold" />
              {t('integrated_hint')}
            </label>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-bold text-navy-700">{t('standards')}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {STANDARD_CODES.map((s) => (
                <button key={s} type="button" onClick={() => toggleStandard(s)} aria-pressed={standards.includes(s)}
                  className={`rounded-xl border-2 p-3 text-start ${standards.includes(s) ? 'border-gold bg-gold-50 dark:bg-navy-700' : 'border-surface-border hover:border-navy-300 dark:border-navy-600'}`}>
                  <p className="font-inter font-bold text-navy-700">{s}</p>
                  <p className="text-[11px] text-navy-400">{s === 'ISO 13485' ? 'IAF MD 9 (−20%)' : s === 'ISO 50001' ? 'ISO 50003' : 'IAF MD 5'}</p>
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="card animate-fade-up p-6">
              <h2 className="mb-4 font-bold text-navy-700">Standard Time Table</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border text-xs text-navy-400 dark:border-navy-600">
                      <th className="px-2 pb-2 text-start font-semibold">{t('standard')}</th>
                      <th className="px-2 pb-2 text-start font-semibold">Risk/Complexity</th>
                      <th className="px-2 pb-2 text-start font-semibold">Base Audit Time</th>
                      <th className="px-2 pb-2 text-start font-semibold">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.standardsBreakdown.map((b) => (
                      <tr key={b.standard} className="border-b border-surface-border/60 last:border-0 dark:border-navy-600">
                        <td className="px-2 py-2 font-inter font-bold text-navy-700">{b.standard}</td>
                        <td className="px-2 py-2">{b.complexity}</td>
                        <td className="px-2 py-2 font-inter">{b.baseDays} MD</td>
                        <td className="px-2 py-2 font-inter text-xs">{b.reference}</td>
                      </tr>
                    ))}
                    <tr className="bg-surface-gray font-bold dark:bg-navy-900">
                      <td className="px-2 py-2">{t('before_reductions')}</td>
                      <td /><td className="px-2 py-2 font-inter">{result.totalBeforeReduction} MD</td><td />
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                {[['MD5', `${result.md5ReductionPercent}%`], ['MD9', `${result.md9ReductionPercent}%`], ['MD11', `${result.md11ReductionPercent}%`], ['Final Days', String(result.finalInitialAuditDays)], ['Rounded', String(result.roundedFinalAuditDays)]].map(([l, v]) => (
                  <div key={l} className="rounded-lg bg-surface-gray p-2 text-center dark:bg-navy-900">
                    <p className="text-[11px] text-navy-400">{l}</p>
                    <p className="font-inter font-bold text-navy-700">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20 h-fit space-y-4">
          <div className="card border-2 border-gold/40 p-6">
            <h2 className="mb-4 font-bold text-navy-700">{t('review_calc')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-navy-400">{t('standards')}</dt><dd className="font-bold text-navy-700">{standards.length}</dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">MD11</dt><dd>{isIntegrated && standards.length > 1 ? <span className="rounded bg-green-50 px-2 text-xs font-bold text-status-green">−20%</span> : <span className="rounded bg-slate-100 px-2 text-xs font-bold text-slate-500">—</span>}</dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">{t('before_reductions')}</dt><dd className="font-inter font-bold text-navy-700">{result?.totalBeforeReduction ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">{t('final_days')}</dt><dd className="font-inter text-xl font-bold text-gold-600">{result?.roundedFinalAuditDays ?? '—'}</dd></div>
            </dl>
            <button onClick={calc} disabled={busy || standards.length === 0} className="btn-primary mt-5 w-full py-2.5">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />} {t('calculate')}
            </button>
            {error && <p role="alert" className="mt-2 text-xs font-bold text-status-red">{error}</p>}
          </div>

          {result && (
            <div className="card animate-fade-up p-5">
              <h3 className="mb-3 text-sm font-bold text-navy-700">{t('audit_days_calc')}</h3>
              <div className="grid grid-cols-2 gap-2 text-center">
                {[[t('stage1'), result.stage1Days], [t('stage2'), result.stage2Days], [t('surveillance'), result.surveillanceDays], [t('recert'), result.recertDays]].map(([l, v]) => (
                  <div key={l as string} className="rounded-xl bg-navy-700 p-3 text-white">
                    <p className="text-[11px] opacity-80">{l}</p>
                    <p className="text-2xl font-bold text-gold">{v}</p>
                    <p className="text-[10px] opacity-60">{t('day')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
