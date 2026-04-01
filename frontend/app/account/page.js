'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EmptyState from '@/components/ui/empty-state';
import NotificationsPanel from '@/components/ui/notifications-panel';
import StatusBadge from '@/components/ui/status-badge';
import KpiGrid from '@/components/dashboard/kpi-grid';
import { getCurrentUser, getTenantDashboard, markNotificationRead, resolveBackendFileUrl, updateCurrentUserProfile } from '@/lib/client-api';
import { useLanguage } from '@/components/i18n/language-provider';
import { formatDate, formatMoney } from '@/lib/format';

const EMPTY_ACCOUNT_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  preferred_lang: 'ar',
  current_password: '',
};

function buildAccountForm(user) {
  return {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    city: user?.profile?.city || '',
    address: user?.profile?.address || '',
    preferred_lang: user?.profile?.preferred_lang || 'ar',
    current_password: '',
  };
}

function InfoField({ label, value }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{value || '-'}</div>
    </div>
  );
}

function isImageFile(url) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url || '');
}

function TenantProfileCard({ profile, t, lang }) {
  const profilePhotoUrl = resolveBackendFileUrl(profile.photo_url);
  const idDocumentUrl = resolveBackendFileUrl(profile.id_document_url);

  return (
    <article className="card">
      <div className="section-header" style={{ marginBottom: '12px' }}>
        <div>
          <p className="section-label">{t('account.linkedProfileLabel', 'Linked profile')}</p>
          <h3 style={{ marginBottom: '6px' }}>{profile.full_name}</h3>
          <p className="text-muted text-sm">{profile.organization || profile.email || '-'}</p>
        </div>
        <StatusBadge status={profile.total_contracts > 0 ? 'approved' : 'pending'} />
      </div>
      {(profilePhotoUrl || (idDocumentUrl && isImageFile(idDocumentUrl))) ? (
        <div className="client-grid" style={{ marginBottom: '14px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {profilePhotoUrl ? (
            <div className="field" style={{ padding: '10px' }}>
              <div className="field-label">{t('account.profilePhoto', 'Profile photo')}</div>
              <img src={profilePhotoUrl} alt={profile.full_name} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '14px' }} />
            </div>
          ) : null}
          {idDocumentUrl && isImageFile(idDocumentUrl) ? (
            <div className="field" style={{ padding: '10px' }}>
              <div className="field-label">{t('account.idDocument', 'ID document')}</div>
              <img src={idDocumentUrl} alt={`${profile.full_name} document`} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '14px' }} />
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="client-grid">
        <InfoField label={t('account.profileType', 'Profile type')} value={profile.type} />
        <InfoField label={t('account.profileRef', 'Reference')} value={profile.cin_or_rc} />
        <InfoField label={t('account.phone', 'Phone')} value={profile.phone} />
        <InfoField label={t('account.city', 'City')} value={profile.city} />
        <InfoField label={t('account.contracts', 'Contracts')} value={profile.total_contracts} />
        <InfoField label={t('account.totalSpent', 'Total spent')} value={`${formatMoney(profile.total_spent, lang)} ${t('common.currency', 'MAD')}`} />
      </div>
      <div className="row-actions" style={{ marginTop: '14px' }}>
        {profilePhotoUrl ? <a className="btn btn-ghost btn-sm" href={profilePhotoUrl} target="_blank" rel="noreferrer">{t('account.openProfilePhoto', 'Open profile photo')}</a> : null}
        {idDocumentUrl ? <a className="btn btn-ghost btn-sm" href={idDocumentUrl} target="_blank" rel="noreferrer">{t('account.openIdDocument', 'Open ID document')}</a> : null}
      </div>
    </article>
  );
}

export default function AccountPage() {
  const { t, lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_ACCOUNT_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    Promise.all([getCurrentUser(), getTenantDashboard()])
      .then(([userResponse, dashboardResponse]) => {
        const nextUser = userResponse.user || null;
        setUser(nextUser);
        setForm(buildAccountForm(nextUser));
        setDashboard(dashboardResponse);
      })
      .catch((requestError) => {
        if (requestError.status === 401 || requestError.status === 403) {
          window.location.href = '/login?next=/account';
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(buildAccountForm(user));
    setSaveError('');
    setSaveMessage('');
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveMessage('');

    try {
      const response = await updateCurrentUserProfile(form);
      setUser(response.user || null);
      setForm(buildAccountForm(response.user || null));
      setSaveMessage(response.detail || t('account.saveSuccess', 'Account updated successfully.'));
    } catch (requestError) {
      setSaveError(requestError.message || t('account.saveError', 'Unable to save your changes.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    try {
      await markNotificationRead(notificationId);
      setDashboard((current) => ({
        ...current,
        counts: {
          ...(current?.counts || {}),
          notifications: Math.max((current?.counts?.notifications || 1) - 1, 0),
        },
        notifications: (current?.notifications || []).map((entry) => (
          entry.id === notificationId ? { ...entry, is_read: true } : entry
        )),
      }));
    } catch (_) {
      // ignore mark-read failures in UI
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><span>{t('account.loading', 'Loading account...')}</span></div>;
  }

  if (!user || !dashboard) {
    return <EmptyState icon="!" title={t('account.errorTitle', 'Unable to load account')} description={error || t('account.errorText', 'Please log in again to continue.')} actionHref="/login" actionLabel={t('account.loginAction', 'Login')} />;
  }

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('account.eyebrow', 'Client Profile')}</p>
        <h1>{t('account.title', 'My Account')}</h1>
        <p className="text-muted">{t('account.subtitle', 'Review your personal information, linked client files, and printable documents from one place.')}</p>
        <div className="hero-actions">
          <Link href="/tenant-dashboard" className="btn btn-ghost">{t('account.dashboardAction', 'Open dashboard')}</Link>
          <Link href="/catalogue" className="btn btn-primary">{t('account.catalogueAction', 'Browse products')}</Link>
        </div>
      </section>

      <section className="section-block mt-4">
        <KpiGrid
          items={[
            { icon: '⌕', label: t('account.requests', 'Requests'), value: dashboard.counts?.requests || 0 },
            { icon: '▣', label: t('account.contracts', 'Contracts'), value: dashboard.counts?.contracts || 0 },
            { icon: '✉', label: t('account.notifications', 'Notifications'), value: dashboard.counts?.notifications || 0 },
            { icon: '◌', label: t('account.linkedProfiles', 'Linked Profiles'), value: dashboard.counts?.tenants || 0 },
          ]}
        />
      </section>

      <section className="section-block mt-4">
        <div className="section-header">
          <div>
            <p className="section-label">{t('account.notificationsLabel', 'Notifications')}</p>
            <h2>{t('account.notificationsTitle', 'Latest notifications')}</h2>
          </div>
        </div>
        <NotificationsPanel
          notifications={dashboard.notifications || []}
          onMarkRead={handleMarkNotificationRead}
          title={t('account.notifications', 'Notifications')}
          emptyTitle={t('account.noNotificationsTitle', 'No notifications yet')}
          emptyText={t('account.noNotificationsText', 'Notifications sent by staff will appear here.')}
          actionLabel={t('account.downloadAction', 'Open')}
          readLabel={t('account.markReadAction', 'Mark as read')}
        />
      </section>

      <section className="section-block mt-4">
        <div className="section-header">
          <div>
            <p className="section-label">{t('account.profileLabel', 'Profile')}</p>
            <h2>{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}</h2>
            <p className="text-muted text-sm">{t('account.profileText', 'Your login account and the linked client billing files appear below.')}</p>
          </div>
          <StatusBadge status={dashboard.counts?.contracts ? 'approved' : 'pending'} label={dashboard.counts?.contracts ? t('account.clientActive', 'Client active') : t('account.clientNew', 'New client')} />
        </div>

        <div className="card" style={{ padding: '16px', marginBottom: '14px', background: 'rgba(10,14,22,0.55)' }}>
          <div className="form-grid cols-3">
            <InfoField label={t('account.username', 'Username')} value={user.username} />
            <InfoField label={t('account.userType', 'Account Type')} value={user.profile?.user_type} />
            <InfoField label={t('account.preferredLang', 'Preferred language')} value={user.profile?.preferred_lang} />
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <p className="section-label" style={{ marginBottom: '10px' }}>{t('account.editLabel', 'Edit account information')}</p>
            <p className="text-muted text-sm">{t('account.editText', 'You can update your personal information here. Saving changes requires your current password.')}</p>
          </div>

          {saveMessage ? <div className="alert alert-ok">{saveMessage}</div> : null}
          {saveError ? <div className="alert alert-danger">{saveError}</div> : null}

          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('account.firstName', 'First name')}</label>
              <input className="input" value={form.first_name} onChange={(event) => updateField('first_name', event.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('account.lastName', 'Last name')}</label>
              <input className="input" value={form.last_name} onChange={(event) => updateField('last_name', event.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('account.email', 'Email')}</label>
            <input className="input" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          </div>

          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('account.phone', 'Phone')}</label>
              <input className="input" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('account.city', 'City')}</label>
              <input className="input" value={form.city} onChange={(event) => updateField('city', event.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('account.address', 'Address')}</label>
            <textarea className="input" rows="4" value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          </div>

          <div className="form-grid cols-2">
            <div className="form-group">
              <label className="form-label">{t('account.preferredLang', 'Preferred language')}</label>
              <select className="input" value={form.preferred_lang} onChange={(event) => updateField('preferred_lang', event.target.value)}>
                <option value="ar">{t('language.ar', 'Arabic')}</option>
                <option value="fr">{t('language.fr', 'French')}</option>
                <option value="en">{t('language.en', 'English')}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('account.currentPassword', 'Current password')}</label>
              <input className="input" type="password" value={form.current_password} onChange={(event) => updateField('current_password', event.target.value)} placeholder={t('account.currentPasswordPlaceholder', 'Enter your password to confirm changes')} required />
            </div>
          </div>

          <div className="row-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? t('account.saving', 'Saving...') : t('account.saveAction', 'Save changes')}
            </button>
            <button className="btn btn-ghost" type="button" onClick={resetForm} disabled={saving}>
              {t('account.resetAction', 'Restore values')}
            </button>
          </div>
        </form>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <p className="section-label">{t('account.linkedProfilesLabel', 'Linked client files')}</p>
            <h2>{t('account.linkedProfilesTitle', 'Associated billing and contract profiles')}</h2>
          </div>
        </div>

        {(dashboard.tenant_profiles || []).length === 0 ? (
          <EmptyState icon="◌" title={t('account.noProfilesTitle', 'No linked profiles yet')} description={t('account.noProfilesText', 'A client profile will appear here as soon as your first approved rental request generates a contract.')} />
        ) : (
          <div className="stack-list">
            {dashboard.tenant_profiles.map((profile) => (
              <TenantProfileCard key={profile.id} profile={profile} t={t} lang={lang} />
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <p className="section-label">{t('account.contractsLabel', 'Contracts')}</p>
            <h2>{t('account.contractsTitle', 'Latest contracts and printable files')}</h2>
          </div>
        </div>

        {(dashboard.latest_contracts || []).length === 0 ? (
          <EmptyState icon="▣" title={t('account.noContractsTitle', 'No contracts yet')} description={t('account.noContractsText', 'Approved rental requests will generate contracts and download links that appear here automatically.')} />
        ) : (
          <div className="stack-list">
            {dashboard.latest_contracts.map((contract) => (
              <article key={contract.id} className="request-row">
                <div className="request-info">
                  <strong>{contract.contract_number}</strong>
                  <small>{contract.event_name || t('account.untitledEvent', 'Untitled event')}</small>
                  <div className="meta">
                    <span className="text-xs text-muted">{formatDate(contract.start_date, lang)} - {formatDate(contract.end_date, lang)}</span>
                    {contract.venue ? <span className="text-xs text-muted">{contract.venue}</span> : null}
                  </div>
                </div>
                <div className="request-actions">
                  <StatusBadge status={contract.status} />
                  <div className="row-actions">
                    {contract.contract_preview_url ? <a className="btn btn-primary btn-sm" href={resolveBackendFileUrl(contract.contract_preview_url)} target="_blank" rel="noreferrer">{t('account.viewContract', 'View contract')}</a> : null}
                    {contract.contract_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(`${contract.contract_preview_url}?print=1`)} target="_blank" rel="noreferrer">{t('account.printContract', 'Print contract')}</a> : null}
                    {contract.contract_pdf_url ? <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(contract.contract_pdf_url)} target="_blank" rel="noreferrer">{t('account.downloadAction', 'Download')}</a> : null}
                    {contract.return_preview_url ? <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(contract.return_preview_url)} target="_blank" rel="noreferrer">{t('account.returnDocument', 'Return document')}</a> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <p className="section-label">{t('account.requestsLabel', 'Requests')}</p>
            <h2>{t('account.requestsTitle', 'Recent requests')}</h2>
          </div>
        </div>

        {(dashboard.latest_requests || []).length === 0 ? (
          <EmptyState icon="⌕" title={t('account.noRequestsTitle', 'No requests yet')} description={t('account.noRequestsText', 'Choose a product from the catalogue and submit your first rental request.')} actionHref="/catalogue" actionLabel={t('account.startRequest', 'Start now')} />
        ) : (
          <div className="stack-list">
            {dashboard.latest_requests.slice(0, 5).map((request) => (
              <article key={request.id} className="request-row">
                <div className="request-info">
                  <strong>{request.item?.name}</strong>
                  <small>{request.event_name || t('account.untitledEvent', 'Untitled event')}</small>
                  <div className="meta">
                    <span className="text-xs text-muted">{t('account.qty', 'Qty')}: {request.qty}</span>
                    {request.start_date ? <span className="text-xs text-muted">{formatDate(request.start_date, lang)} - {formatDate(request.end_date, lang)}</span> : null}
                    {request.venue ? <span className="text-xs text-muted">{request.venue}</span> : null}
                  </div>
                </div>
                <StatusBadge status={request.status} />
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}