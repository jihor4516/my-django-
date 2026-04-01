'use client';

import { useLanguage } from '@/components/i18n/language-provider';

export default function ProcessTimeline() {
  const { t, messages } = useLanguage();
  const rentalSteps = messages.site?.rentalSteps || [];

  return (
    <section className="section-block">
      <div className="section-header">
        <div>
          <p className="section-label">{t('home.processSectionLabel', 'Workflow')}</p>
          <h2>{t('home.processSectionTitle', 'Customer Journey')}</h2>
        </div>
      </div>
      <div className="grid grid-4">
        {rentalSteps.map((step) => (
          <article key={step.number} className="card process-card">
            <div className="process-number">{step.number}</div>
            <h3>{step.title}</h3>
            <p className="text-muted">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
