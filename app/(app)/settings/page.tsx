'use client';
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Save, Loader2, Check, Bot, Building2, Database, Users, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/i18n';

interface Profile { id: string; email: string | null; full_name: string | null; role: string; }

export default function SettingsPage() {
  const { t } = useLang();
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-sonnet-4-5');
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  // المستخدمون
  const [me, setMe] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [newUser, setNewUser] = useState({ email: '', password: '', full_name: '', role: 'viewer' });
  const [userBusy, setUserBusy] = useState(false);
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const ROLES = [
    { key: 'admin', label: t('admin') },
    { key: 'lead_auditor', label: t('lead_auditor_role') },
    { key: 'auditor', label: t('auditor_role') },
    { key: 'viewer', label: t('viewer_role') },
  ];

  const loadUsers = useCallback(async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at');
    setUsers((profiles as Profile[]) ?? []);
    setMe(((profiles as Profile[]) ?? []).find((p) => p.id === auth.user?.id) ?? null);
  }, []);

  useEffect(() => {
    createClient()
      .from('app_settings')
      .select('key, value')
      .then(({ data }) => {
        const get = (k: string) => data?.find((r) => r.key === k)?.value ?? '';
        const key = get('anthropic_api_key');
        setHasKey(Boolean(key));
        setApiKey(key ? '••••••••' + key.slice(-6) : '');
        setModel(get('ai_model') || 'claude-sonnet-4-5');
        setCompanyName(get('company_name'));
        setWebsite(get('company_website'));
      });
    loadUsers();
  }, [loadUsers]);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const rows: { key: string; value: string }[] = [
      { key: 'ai_model', value: model },
      { key: 'company_name', value: companyName },
      { key: 'company_website', value: website },
    ];
    if (apiKey && !apiKey.startsWith('••••')) rows.push({ key: 'anthropic_api_key', value: apiKey.trim() });
    if (apiKey === '') rows.push({ key: 'anthropic_api_key', value: '' });
    await supabase.from('app_settings').upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })));
    setSaving(false);
    setSaved(true);
    setHasKey(Boolean(apiKey));
    setTimeout(() => setSaved(false), 2000);
  }

  async function createUser() {
    setUserBusy(true);
    setUserMsg(null);
    const supabase = createClient();
    const { error } = await supabase.rpc('create_app_user', {
      p_email: newUser.email.trim(),
      p_password: newUser.password,
      p_full_name: newUser.full_name.trim(),
      p_role: newUser.role,
    });
    if (error) {
      setUserMsg({ ok: false, text: error.message });
    } else {
      setUserMsg({ ok: true, text: t('user_created') });
      setNewUser({ email: '', password: '', full_name: '', role: 'viewer' });
      loadUsers();
    }
    setUserBusy(false);
  }

  async function changeRole(userId: string, role: string) {
    const supabase = createClient();
    await supabase.rpc('set_user_role', { p_user_id: userId, p_role: role });
    loadUsers();
  }

  async function removeUser(userId: string) {
    if (!confirm(t('confirm_delete_user'))) return;
    const supabase = createClient();
    await supabase.rpc('delete_app_user', { p_user_id: userId });
    loadUsers();
  }

  const isAdmin = me?.role === 'admin';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{t('settings')}</h1>
        <p className="text-sm text-navy-400">{t('settings_sub')}</p>
      </div>

      {/* المساعد الذكي */}
      <div className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-navy-700">
          <Bot className="h-5 w-5 text-gold" /> {t('ai_assistant')}
        </h2>
        <p className="mb-4 text-xs text-navy-400">
          {t('ai_hint')}{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="font-bold text-navy-500 underline">console.anthropic.com</a>{' '}
          {t('ai_hint2')}
        </p>
        <div className="space-y-3">
          <div>
            <label className="label flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" /> {t('api_key')}</label>
            <input dir="ltr" className="input font-inter" placeholder="sk-ant-api03-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} autoComplete="off" />
            {hasKey && <p className="mt-1 text-[11px] font-semibold text-status-green">{t('key_saved')}</p>}
          </div>
          <div>
            <label className="label">{t('model')}</label>
            <select className="input font-inter" dir="ltr" value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="claude-sonnet-4-5">claude-sonnet-4-5</option>
              <option value="claude-opus-4-8">claude-opus-4-8</option>
              <option value="claude-haiku-4-5-20251001">claude-haiku-4-5</option>
            </select>
          </div>
        </div>
      </div>

      {/* المستخدمون والصلاحيات */}
      <div className="card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-navy-700">
          <Users className="h-5 w-5 text-gold" /> {t('users_admins')}
        </h2>
        <p className="mb-4 text-xs text-navy-400">{t('users_hint')}</p>

        {!isAdmin ? (
          <p className="rounded-lg bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-600">{t('admin_only')}</p>
        ) : (
          <>
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs text-navy-400 dark:border-navy-600">
                    <th className="px-2 pb-2 text-start font-semibold">{t('full_name')}</th>
                    <th className="px-2 pb-2 text-start font-semibold">{t('email')}</th>
                    <th className="px-2 pb-2 text-start font-semibold">{t('role')}</th>
                    <th className="px-2 pb-2 text-start font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-surface-border/60 last:border-0 dark:border-navy-600">
                      <td className="px-2 py-2.5 font-bold text-navy-700">
                        <span className="flex items-center gap-1.5">
                          {u.role === 'admin' && <ShieldCheck className="h-4 w-4 text-gold" aria-hidden />}
                          {u.full_name ?? '—'}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 font-inter text-xs" dir="ltr">{u.email}</td>
                      <td className="px-2 py-2.5">
                        <select
                          className="input w-36 py-1 text-xs"
                          value={u.role}
                          disabled={u.id === me?.id}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          aria-label={`${t('role')} ${u.email}`}
                        >
                          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2.5">
                        {u.id !== me?.id && (
                          <button onClick={() => removeUser(u.id)} className="rounded p-1.5 text-navy-400 hover:bg-red-50 hover:text-status-red" title={t('delete')} aria-label={`${t('delete')} ${u.email}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl border border-dashed border-surface-border p-4 dark:border-navy-600">
              <p className="mb-3 text-sm font-bold text-navy-700">{t('add_user')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className="label">{t('full_name')}</label><input className="input" value={newUser.full_name} onChange={(e) => setNewUser((f) => ({ ...f, full_name: e.target.value }))} /></div>
                <div><label className="label">{t('role')}</label>
                  <select className="input" value={newUser.role} onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
                <div><label className="label">{t('email')}</label><input type="email" dir="ltr" className="input font-inter" value={newUser.email} onChange={(e) => setNewUser((f) => ({ ...f, email: e.target.value }))} /></div>
                <div><label className="label">{t('password')}</label><input type="password" dir="ltr" className="input font-inter" value={newUser.password} onChange={(e) => setNewUser((f) => ({ ...f, password: e.target.value }))} /></div>
              </div>
              {userMsg && (
                <p role="alert" className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${userMsg.ok ? 'bg-green-50 text-status-green' : 'bg-red-50 text-status-red'}`}>
                  {userMsg.text}
                </p>
              )}
              <button
                onClick={createUser}
                disabled={userBusy || !newUser.email || newUser.password.length < 8 || !newUser.full_name}
                className="btn-primary mt-3"
              >
                {userBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t('create_user')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* بيانات الشركة */}
      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold text-navy-700">
          <Building2 className="h-5 w-5 text-gold" /> {t('company_data')}
        </h2>
        <div className="space-y-3">
          <div><label className="label">{t('company_name')}</label><input className="input font-inter" dir="ltr" value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
          <div><label className="label">{t('website')}</label><input className="input font-inter" dir="ltr" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
        </div>
      </div>

      {/* قاعدة البيانات */}
      <div className="card p-6">
        <h2 className="mb-2 flex items-center gap-2 font-bold text-navy-700">
          <Database className="h-5 w-5 text-gold" /> {t('database')}
        </h2>
        <p className="font-inter text-xs leading-relaxed text-navy-400" dir="ltr">
          Supabase project: <b>iso system</b> (mgkjvkyownnsbrqtbsvf) — configured via <code className="rounded bg-surface-gray px-1 dark:bg-navy-900">.env.local</code>.
          To migrate: run <code className="rounded bg-surface-gray px-1 dark:bg-navy-900">supabase/schema.sql</code> + <code className="rounded bg-surface-gray px-1 dark:bg-navy-900">seed.sql</code> in the SQL Editor.
        </p>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full py-2.5">
        {saved ? <Check className="h-4 w-4" /> : saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saved ? t('saved') : t('save_settings')}
      </button>
    </div>
  );
}
