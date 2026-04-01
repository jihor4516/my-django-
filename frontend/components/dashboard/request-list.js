import StatusBadge from '@/components/ui/status-badge';
import { formatDate } from '@/lib/format';

export default function RequestList({ requests, actions }) {
  return (
    <div className="stack-list">
      {requests.map((requestItem) => (
        <article key={requestItem.id} className="request-row">
          <div className="request-info">
            <strong>{requestItem.item?.name || '—'}</strong>
            <small>{requestItem.user?.full_name || requestItem.user?.username || 'عميل'}</small>
            <div className="meta">
              <span className="text-xs text-muted">كمية: {requestItem.qty}</span>
              {requestItem.event_name ? <span className="text-xs text-muted">الفعالية: {requestItem.event_name}</span> : null}
              {requestItem.start_date ? <span className="text-xs text-muted">{formatDate(requestItem.start_date)} - {formatDate(requestItem.end_date)}</span> : null}
            </div>
            {requestItem.staff_note ? <p className="text-xs text-muted">{requestItem.staff_note}</p> : null}
          </div>
          <div className="request-actions">
            <StatusBadge status={requestItem.status} />
            {actions}
          </div>
        </article>
      ))}
    </div>
  );
}
