'use client';

import Link from 'next/link';
import StatusBadge from '@/components/ui/status-badge';
import { useLanguage } from '@/components/i18n/language-provider';
import { resolveBackendFileUrl } from '@/lib/backend-url';
import { truncateText } from '@/lib/format';

export default function FeaturedProducts({ items }) {
  const { t } = useLanguage();

  if (!items?.length) return null;

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <p className="section-label">{t('home.featuredSectionLabel', 'Featured Products')}</p>
          <h2>{t('home.featuredSectionTitle', 'Store Experience')}</h2>
        </div>
        <Link href="/catalogue" className="btn btn-ghost btn-sm">{t('home.enterStore', 'Open Store')}</Link>
      </div>
      <div className="grid grid-4">
        {items.map((item) => (
          <Link key={item.id} href={`/items/${item.id}`} className="product-card card-link">
            <div className="product-thumb">
              {item.main_image ? <img src={resolveBackendFileUrl(item.main_image)} alt={item.name} /> : <span className="thumb-placeholder">◦</span>}
            </div>
            <div className="product-body">
              <p className="product-cat">{item.category?.name}</p>
              <h3 className="product-name">{item.name}</h3>
              <p className="text-muted text-sm">{truncateText(item.description, 90)}</p>
            </div>
            <div className="product-footer">
              <StatusBadge status={item.status} />
              <small className="text-muted">{t('home.availablePrefix', 'Available:')} {item.quantity_available}</small>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
