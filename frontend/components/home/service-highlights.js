'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/language-provider';

export default function ServiceHighlights() {
  const { t, messages } = useLanguage();
  const serviceHighlights = messages.site?.serviceHighlights || [];

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <p className="section-label">{t('home.servicesSectionLabel', 'Services')}</p>
          <h2>{t('home.servicesSectionTitle', 'Integrated Services')}</h2>
        </div>
        <Link href="/services" className="btn btn-ghost btn-sm">{t('home.allServices', 'All Services')}</Link>
      </div>
      <div className="service-grid">
        {serviceHighlights.map((service) => (
          <article key={service.title} className="service-card">
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
