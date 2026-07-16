'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LogIn, Loader2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(t('login_error'));
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy-700 via-navy-600 to-navy-500 p-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-3 flex justify-end">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20">
            {t('toggle_lang')}
          </button>
        </div>
        <div className="card p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <Image src="/logo.jpg" alt="ISO CERT INTERNATIONAL" width={96} height={96} className="rounded-full shadow-card" priority />
            <div className="text-center">
              <h1 className="text-xl font-bold text-navy-700">{t('app_name')}</h1>
              <p className="text-sm text-navy-400">{t('app_sub')}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" aria-label={t('sign_in')}>
            <div>
              <label htmlFor="email" className="label">{t('email')}</label>
              <input
                id="email"
                type="email"
                dir="ltr"
                className="input text-left font-inter"
                placeholder="admin@isocert.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">{t('password')}</label>
              <input
                id="password"
                type="password"
                dir="ltr"
                className="input text-left font-inter"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-status-red">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {t('sign_in')}
            </button>

            <div className="flex items-center justify-between text-sm">
              <a href="#" className="text-navy-500 hover:text-navy-700 hover:underline">{t('forgot_password')}</a>
              <Link href="/register" className="flex items-center gap-1 font-bold text-gold-600 hover:underline">
                <Building2 className="h-4 w-4" /> {t('apply_cert')}
              </Link>
            </div>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-navy-100/80">
          International Certification Body — iso-cert.uk
        </p>
      </div>
    </div>
  );
}
