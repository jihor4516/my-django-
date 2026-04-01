'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/language-provider';

export default function HeroBanner({ categoriesCount, itemsCount }) {
  const { t } = useLanguage();

  return (
    <section className="hero-landing">
      <span className="eyebrow">{t('site.name', 'Grand Theatre')} - {t('site.city', 'Rabat')}</span>
      <h1>{t('home.heroTitle', 'Modern rental platform')}</h1>
      <p>{t('site.description', '')}</p>
      <div className="hero-actions">
        <Link href="/catalogue" className="btn btn-primary btn-lg">{t('home.exploreProducts', 'Explore Products')}</Link>
        <Link href="/services" className="btn btn-ghost btn-lg">{t('home.digitalServices', 'Digital Services')}</Link>
      </div>
      <div className="hero-stats">
        <div className="stat-item">
          <strong>{categoriesCount}+</strong>
          <span>{t('home.availableCategories', 'Available Categories')}</span>
        </div>
        <div className="stat-item">
          <strong>{itemsCount}+</strong>
          <span>{t('home.rentableItems', 'Rentable Items')}</span>
        </div>
        <div className="stat-item">
          <strong>PDF</strong>
          <span>{t('home.officialDocs', 'Official Docs')}</span>
        </div>
        <div className="stat-item">
          <strong>24/7</strong>
          <span>{t('home.requestReception', 'Request Intake')}</span>
        </div>
      </div>
    </section>
  );
}
