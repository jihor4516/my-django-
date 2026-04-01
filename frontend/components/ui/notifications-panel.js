'use client';

import { useLanguage } from '@/components/i18n/language-provider';

export default function NotificationsPanel({ notifications, onMarkRead, title = 'Notifications', emptyTitle = 'No notifications yet', emptyText = 'Notifications sent by staff will appear here.', actionLabel = 'Open', readLabel = 'Mark as read' }) {
  const { t } = useLanguage();

  return (
    <div className="stack-list">
      {!notifications?.length ? (
        <div className="card empty-state">
          <div className="empty-state-icon">◌</div>
          <h3>{emptyTitle}</h3>
          <p className="text-muted">{emptyText}</p>
        </div>
      ) : (
        notifications.map((notification) => (
          <article key={notification.id} className={`notice-card ${notification.is_read ? 'is-read' : 'is-unread'}`}>
            <div className="notice-head">
              <div>
                <strong>{notification.title}</strong>
                <p className="text-muted text-sm">{notification.sender || title}</p>
              </div>
              {notification.is_read ? <span className="notice-badge">{t('notifications.readBadge', 'Read')}</span> : <span className="notice-badge unread">{t('notifications.newBadge', 'New')}</span>}
            </div>
            <p className="notice-message">{notification.message}</p>
            <div className="row-actions">
              {notification.action_url ? <a className="btn btn-primary btn-sm" href={notification.action_url}>{actionLabel}</a> : null}
              {!notification.is_read ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => onMarkRead?.(notification.id)}>{readLabel}</button> : null}
            </div>
          </article>
        ))
      )}
    </div>
  );
}