'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/language-provider';

export default function CategoryGrid({ categories }) {
  const { t } = useLanguage();

  if (!categories?.length) return null;

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <p className="section-label">{t('home.categorySectionLabel', 'Categories')}</p>
          <h2>{t('home.categorySectionTitle', 'Products by Category')}</h2>
        </div>
      </div>
      <div className="grid grid-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/catalogue?cat=${category.slug}`} className="cat-card">
            <span className="cat-name">{category.name}</span>
            <span className="cat-count">{category.items_count || 0} {t('home.productsSuffix', 'products')}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
