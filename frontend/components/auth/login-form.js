'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/lib/client-api';
import { useLanguage } from '@/components/i18n/language-provider';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await loginUser({ username, password });
      const next = searchParams.get('next');
      const target = next || (data.user?.is_staff_user ? '/admin' : '/tenant-dashboard');
      router.replace(target);
      router.refresh();
      setTimeout(() => {
        window.location.assign(target);
      }, 120);
    } catch (err) {
      setError(err.data?.detail || err.message || t('auth.loginError', 'Invalid login credentials'));
    } finally { setLoading(false); }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <p className="eyebrow" style={{ marginBottom: '8px' }}>{t('auth.brand', 'Mohammed V Theatre')}</p>
        <h1>{t('auth.loginTitle', 'Login')}</h1>
        <p className="subtitle">{t('auth.loginSubtitle', 'Enter your credentials to access your account')}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">{t('auth.username', 'Username or email')}</label>
            <input className="input" placeholder="username" value={username}
              onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">{t('auth.password', 'Password')}</label>
            <input className="input" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <button className="btn btn-primary full-width" type="submit" disabled={loading} style={{ marginTop: '4px' }}>
            {loading ? t('auth.loginLoading', 'Logging in...') : t('auth.loginSubmit', 'Login')}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
          {t('auth.noAccount', "Don't have an account?")}{' '}
          <Link href="/signup" style={{ color: 'var(--accent-soft)' }}>{t('auth.createAccountLink', 'Create account')}</Link>
        </p>
      </div>
    </div>
  );
}
