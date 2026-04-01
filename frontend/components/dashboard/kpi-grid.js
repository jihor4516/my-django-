export default function KpiGrid({ items }) {
  return (
    <div className="grid grid-kpi">
      {items.map((item) => (
        <article key={item.label} className="kpi-card">
          <span className="kpi-icon">{item.icon}</span>
          <span className="kpi-value">{item.value ?? '—'}</span>
          <span className="kpi-label">{item.label}</span>
        </article>
      ))}
    </div>
  );
}
