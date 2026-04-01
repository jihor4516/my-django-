import Link from 'next/link';

export default function EmptyState({ title, description, actionHref, actionLabel, icon = '◦' }) {
  return (
    <div className="card empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description ? <p className="text-muted">{description}</p> : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn btn-primary" style={{ marginTop: '16px' }}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
