'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/i18n/language-provider';

export default function CtaPanel() {
  const { t } = useLanguage();

  return (
    <section className="section-block">
      <div className="cta-panel">
        <h2>{t('home.ctaTitle', 'Start Digital Transformation')}</h2>
        <p className="text-muted">
          {t('home.ctaText', 'A professional interface and full operations dashboard.')}
        </p>
        <div className="hero-actions">
          <Link href="/signup" className="btn btn-primary btn-lg">{t('home.createAccount', 'Create Account')}</Link>
          <Link href="/staff-dashboard" className="btn btn-ghost btn-lg">{t('home.staffBoard', 'Staff Dashboard')}</Link>
        </div>
      </div>
    </section>
  );
}
