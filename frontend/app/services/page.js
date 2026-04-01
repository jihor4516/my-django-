import Link from 'next/link';
import { cookies } from 'next/headers';
import { getMessages, normalizeLang, translate } from '@/lib/i18n';

export default function ServicesPage() {
  const cookieStore = cookies();
  const lang = normalizeLang(cookieStore.get('site_lang')?.value || 'ar');
  const messages = getMessages(lang);
  const t = (key, fallback = '') => translate(messages, key, fallback);
  const serviceHighlights = messages.site?.serviceHighlights || [];
  const rentalSteps = messages.site?.rentalSteps || [];

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('servicesPage.eyebrow', 'Digital Services')}</p>
        <h1>{t('servicesPage.title', 'Integrated services')}</h1>
        <p className="text-muted">{t('servicesPage.subtitle', '')}</p>
      </section>

      <section className="section-block">
        <div className="service-grid">
          {serviceHighlights.map((service) => (
            <article key={service.title} className="service-card">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-header">
          <div>
            <p className="section-label">{t('servicesPage.institution', 'Institution')}</p>
            <h2>{t('site.name', 'Grand Theatre')}</h2>
          </div>
        </div>
        <div className="grid grid-2">
          <article className="card">
            <h3>{t('servicesPage.about', 'About')}</h3>
            <p className="text-muted">{t('site.description', '')}</p>
          </article>
          <article className="card">
            <h3>{t('servicesPage.howItWorks', 'How it works?')}</h3>
            <p className="text-muted">{t('servicesPage.howItWorksDesc', '')}</p>
          </article>
        </div>
      </section>

      <section className="section-block">
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

      <section className="section-block">
        <div className="cta-panel">
          <h2>{t('servicesPage.ctaTitle', 'Start with services')}</h2>
          <p className="text-muted">{t('servicesPage.ctaText', '')}</p>
          <div className="hero-actions">
            <Link href="/catalogue" className="btn btn-primary btn-lg">{t('servicesPage.enterCatalogue', 'Enter Catalogue')}</Link>
            <Link href="/signup" className="btn btn-ghost btn-lg">{t('home.createAccount', 'Create Account')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
