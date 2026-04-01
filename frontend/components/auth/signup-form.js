'use client';

import { useState } from 'react';
import { signupUser, verifyUser, resendCode } from '@/lib/client-api';
import { useLanguage } from '@/components/i18n/language-provider';

const initialState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password1: '',
  password2: '',
  phone: '',
  address: '',
  city: '',
  user_type: 'individual',
  cin: '',
  company_name: '',
  rc_number: '',
  ice_number: '',
  association_name: '',
  association_license: '',
};

function extractErrorMessage(err) {
  if (err?.data?.errors) {
    const messages = Object.values(err.data.errors)
      .flat()
      .map((entry) => entry?.message || entry)
      .filter(Boolean);
    if (messages.length) {
      return messages.join(' ');
    }
  }
  return err?.data?.detail || err?.message || 'Request failed';
}

export default function SignupForm() {
  const { t } = useLanguage();
  const [form, setForm] = useState(initialState);
  const [step, setStep] = useState('signup');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSignup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const data = await signupUser(form);
      setMessage(data.verification_code ? `${data.detail} Code: ${data.verification_code}` : data.detail);
      setStep('verify');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await verifyUser({ code });
      setMessage(data.detail);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError('');
    try {
      const data = await resendCode();
      setMessage(data.verification_code ? `${data.detail} Code: ${data.verification_code}` : data.detail);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <div className="auth-page">
        <div className="auth-box">
          <p className="eyebrow" style={{ marginBottom: '8px' }}>{t('auth.verifyEyebrow', 'Account Verification')}</p>
          <h1>{t('auth.verifyTitle', 'Verification Code')}</h1>
          <p className="subtitle">{t('auth.verifySubtitle', 'We sent a code to your email. Enter it below.')}</p>
          {message && <div className="alert alert-ok" style={{ marginBottom: '16px' }}>{message}</div>}
          {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group">
              <label className="form-label">{t('auth.verifyCode', 'Verification code')}</label>
              <input className="input" placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)}
                style={{ textAlign: 'center', letterSpacing: '6px', fontSize: '24px' }} required autoFocus />
            </div>
            <button className="btn btn-primary full-width" type="submit" disabled={loading}>
              {loading ? t('auth.verifyLoading', 'Verifying...') : t('auth.verifySubmit', 'Activate account')}
            </button>
            <button className="btn btn-ghost full-width" type="button" disabled={loading} onClick={handleResend}>
              {t('auth.resendCode', 'Resend code')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const USER_TYPES = [
    { value: 'individual', label: t('auth.userTypeIndividual', 'Individual') },
    { value: 'company', label: t('auth.userTypeCompany', 'Company') },
    { value: 'association', label: t('auth.userTypeAssociation', 'Association') },
    { value: 'government', label: t('auth.userTypeGovernment', 'Government Entity') },
  ];

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: '40px' }}>
      <div className="auth-box" style={{ maxWidth: '580px' }}>
        <p className="eyebrow" style={{ marginBottom: '8px' }}>{t('auth.brand', 'Mohammed V Theatre')}</p>
        <h1>{t('auth.signupTitle', 'Create Account')}</h1>
        <p className="subtitle">{t('auth.signupSubtitle', 'Register to access the rental catalogue and submit your requests')}</p>

        {message && <div className="alert alert-ok" style={{ marginBottom: '16px' }}>{message}</div>}
        {error   && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('auth.firstName', 'First name')}</label>
              <input className="input" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} placeholder="محمد" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.lastName', 'Last name')}</label>
              <input className="input" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} placeholder="العلوي" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('auth.usernameRequired', 'Username *')}</label>
            <input className="input" value={form.username} onChange={(e) => updateField('username', e.target.value)} placeholder="my_username" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('auth.email', 'Email *')}</label>
            <input className="input" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="exemple@mail.com" required />
          </div>
          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('auth.passwordRequired', 'Password *')}</label>
              <input className="input" type="password" value={form.password1} onChange={(e) => updateField('password1', e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.passwordConfirm', 'Confirm password *')}</label>
              <input className="input" type="password" value={form.password2} onChange={(e) => updateField('password2', e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('auth.phone', 'Phone')}</label>
              <input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="+212 6..." required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.city', 'City')}</label>
              <input className="input" value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="الرباط" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('account.address', 'Address')}</label>
            <textarea className="input" rows="3" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="العنوان الكامل" required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('auth.userType', 'User type')}</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {USER_TYPES.map((t) => (
                <button key={t.value} type="button"
                  className={`btn btn-sm ${form.user_type === t.value ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => updateField('user_type', t.value)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.user_type === 'individual' && (
            <div className="form-group">
              <label className="form-label">{t('auth.cin', 'National ID (CIN)')}</label>
              <input className="input" value={form.cin} onChange={(e) => updateField('cin', e.target.value)} placeholder="AB123456" required />
            </div>
          )}
          {form.user_type === 'company' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">{t('auth.companyName', 'Company name')}</label>
                <input className="input" value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} required />
              </div>
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">{t('auth.rcNumber', 'Registration number')}</label>
                  <input className="input" value={form.rc_number} onChange={(e) => updateField('rc_number', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('auth.iceNumber', 'ICE number')}</label>
                  <input className="input" value={form.ice_number} onChange={(e) => updateField('ice_number', e.target.value)} required />
                </div>
              </div>
            </div>
          )}
          {form.user_type === 'association' && (
            <div className="form-grid cols-2">
              <div className="form-group">
                <label className="form-label">{t('auth.associationName', 'Association name')}</label>
                <input className="input" value={form.association_name} onChange={(e) => updateField('association_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('auth.associationLicense', 'License number')}</label>
                <input className="input" value={form.association_license} onChange={(e) => updateField('association_license', e.target.value)} required />
              </div>
            </div>
          )}

          <button className="btn btn-primary full-width" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? t('auth.createLoading', 'Creating account...') : t('auth.createSubmit', 'Create account')}
          </button>
        </form>

        <hr className="divider" />
        <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
          {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
          <a href="/login" style={{ color: 'var(--accent-soft)' }}>{t('auth.loginLink', 'Login')}</a>
        </p>
      </div>
    </div>
  );
}
