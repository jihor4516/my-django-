'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EmptyState from '@/components/ui/empty-state';
import NotificationsPanel from '@/components/ui/notifications-panel';
import StatusBadge from '@/components/ui/status-badge';
import KpiGrid from '@/components/dashboard/kpi-grid';
import { getTenantDashboard, markNotificationRead, resolveBackendFileUrl } from '@/lib/client-api';
import { useLanguage } from '@/components/i18n/language-provider';
import { formatDate } from '@/lib/format';

export default function TenantDashboardPage() {
  const { t, lang } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTenantDashboard(lang)
      .then((response) => setDashboard(response))
      .catch((requestError) => {
        if (requestError.status === 401 || requestError.status === 403) {
          window.location.href = '/login?next=/tenant-dashboard';
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><span>{t('tenantDashboard.loading', 'Loading your account...')}</span></div>;
  }

  if (!dashboard) {
    return <EmptyState icon="!" title={t('tenantDashboard.loadTitle', 'Unable to load account')} description={error || t('tenantDashboard.loadDescription', 'You must log in first.')} actionHref="/login" actionLabel={t('tenantDashboard.loginAction', 'Login')} />;
  }

  const tabs = [
    { id: 'overview', label: t('tenantDashboard.overviewTab', 'Overview') },
    { id: 'requests', label: t('tenantDashboard.requestsTab', 'My Requests') },
    { id: 'contracts', label: t('tenantDashboard.contractsTab', 'Contracts and Downloads') },
  ];

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

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('tenantDashboard.eyebrow', 'Client Account')}</p>
        <h1>{t('tenantDashboard.title', 'Track requests, contracts, and files')}</h1>
        <p className="text-muted">{t('tenantDashboard.subtitle', 'The client portal displays rental requests, generated contracts, and approved PDF links.')}</p>
      </section>

      <section className="section-block mt-4">
        <KpiGrid
          items={[
            { icon: '⌕', label: t('tenantDashboard.countRequests', 'Total Requests'), value: dashboard.counts.requests },
            { icon: '▣', label: t('tenantDashboard.countContracts', 'Contracts'), value: dashboard.counts.contracts },
            { icon: '✉', label: t('tenantDashboard.countNotifications', 'Notifications'), value: dashboard.counts.notifications || 0 },
            { icon: '◌', label: t('tenantDashboard.countProfiles', 'Linked Profiles'), value: dashboard.counts.tenants },
          ]}
        />
      </section>

      <section className="section-block mt-4">
        <div className="section-header">
          <div>
            <p className="section-label">{t('tenantDashboard.notificationsLabel', 'Notifications')}</p>
            <h2>{t('tenantDashboard.notificationsTitle', 'Latest notifications')}</h2>
          </div>
        </div>
        <NotificationsPanel
          notifications={dashboard.notifications || []}
          onMarkRead={handleMarkNotificationRead}
          title={t('tenantDashboard.notificationsLabel', 'Notifications')}
          emptyTitle={t('tenantDashboard.noNotificationsTitle', 'No notifications yet')}
          emptyText={t('tenantDashboard.noNotificationsText', 'Notifications sent by staff will appear here.')}
          actionLabel={t('tenantDashboard.downloadAction', 'Open')}
          readLabel={t('tenantDashboard.markReadAction', 'Mark as read')}
        />
      </section>

      <div className="tabs mt-4">
        {tabs.map((tabItem) => (
          <button key={tabItem.id} type="button" className={`tab-btn ${tab === tabItem.id ? 'active' : ''}`} onClick={() => setTab(tabItem.id)}>{tabItem.label}</button>
        ))}
      </div>

      {tab === 'overview' ? (
        <section className="section-block mt-0">
          {(dashboard.latest_requests || []).length === 0 ? (
            <EmptyState icon="◦" title={t('tenantDashboard.emptyOverviewTitle', 'No requests yet')} description={t('tenantDashboard.emptyOverviewDesc', 'Start from the catalogue page and choose the equipment that fits your event.')} actionHref="/catalogue" actionLabel={t('tenantDashboard.catalogueAction', 'Go to catalogue')} />
          ) : (
            <div className="card">
              <h2 style={{ marginBottom: '18px' }}>{t('tenantDashboard.latestRequests', 'Latest requests')}</h2>
              <div className="stack-list compact">
                {dashboard.latest_requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="row-line">
                    <div>
                      <strong>{request.item?.name}</strong>
                      <p className="text-muted text-sm">{request.event_name || t('tenantDashboard.untitledRequest', 'Untitled request')} · {formatDate(request.created_at, lang)}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'requests' ? (
        <section className="section-block mt-0">
          {(dashboard.latest_requests || []).length === 0 ? (
            <EmptyState icon="⌕" title={t('tenantDashboard.emptyRequestsTitle', 'No requests')} description={t('tenantDashboard.emptyRequestsDesc', 'Once you submit rental requests, they will appear here with their status and staff notes.')} />
          ) : (
            <div className="stack-list">
              {dashboard.latest_requests.map((request) => (
                <article key={request.id} className="request-row">
                  <div className="request-info">
                    <strong>{request.item?.name}</strong>
                    <small>{request.event_name || t('tenantDashboard.untitledEvent', 'Untitled event')}</small>
                    <div className="meta">
                      <span className="text-xs text-muted">{t('tenantDashboard.qty', 'Qty')}: {request.qty}</span>
                      {request.venue ? <span className="text-xs text-muted">{request.venue}</span> : null}
                      {request.start_date ? <span className="text-xs text-muted">{formatDate(request.start_date, lang)} - {formatDate(request.end_date, lang)}</span> : null}
                    </div>
                    {request.staff_note ? <p className="text-xs text-muted">{t('tenantDashboard.staffNote', 'Staff note')}: {request.staff_note}</p> : null}
                  </div>
                  <StatusBadge status={request.status} />
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'contracts' ? (
        <section className="section-block mt-0">
          {(dashboard.latest_contracts || []).length === 0 ? (
            <EmptyState icon="▣" title={t('tenantDashboard.emptyContractsTitle', 'No contracts yet')} description={t('tenantDashboard.emptyContractsDesc', 'After staff approval, your contract download link will appear here.')} />
          ) : (
            <div className="stack-list">
              {dashboard.latest_contracts.map((contract) => (
                <article key={contract.id} className="request-row">
                  <div className="request-info">
                    <strong>{contract.contract_number}</strong>
                    <small>{contract.event_name}</small>
                    <div className="meta">
                      <span className="text-xs text-muted">{formatDate(contract.start_date, lang)} - {formatDate(contract.end_date, lang)}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <StatusBadge status={contract.status} />
                    <div className="row-actions">
                      {contract.contract_preview_url ? <a className="btn btn-primary btn-sm" href={resolveBackendFileUrl(contract.contract_preview_url)} target="_blank" rel="noreferrer">{t('tenantDashboard.contractPreview', 'View Contract')}</a> : null}
                      {contract.contract_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(`${contract.contract_preview_url}?print=1`)} target="_blank" rel="noreferrer">{t('tenantDashboard.contractPrint', 'Print Contract')}</a> : null}
                      <a className="btn btn-ghost btn-sm" href={resolveBackendFileUrl(contract.contract_pdf_url)} target="_blank" rel="noreferrer">{t('tenantDashboard.downloadAction', 'Download Contract')}</a>
                      {contract.return_preview_url ? <a className="btn btn-ok btn-sm" href={resolveBackendFileUrl(contract.return_preview_url)} target="_blank" rel="noreferrer">{t('tenantDashboard.returnDocumentPdf', 'Return Document PDF')}</a> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="section-block">
        <div className="cta-panel">
          <h2>{t('tenantDashboard.nextTitle', 'Next step for the client')}</h2>
          <p className="text-muted">{t('tenantDashboard.nextText', 'You can now return to the store interface to choose more equipment or follow current requests.')}</p>
          <div className="hero-actions">
            <Link href="/account" className="btn btn-ghost">{t('tenantDashboard.accountAction', 'My account')}</Link>
            <Link href="/catalogue" className="btn btn-primary">{t('tenantDashboard.backProducts', 'Back to products')}</Link>
            <Link href="/services" className="btn btn-ghost">{t('tenantDashboard.browseServices', 'Browse services')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
