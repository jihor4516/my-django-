'use client';

import { useLanguage } from '@/components/i18n/language-provider';

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} {t('site.name', 'Grand Theatre')} - {t('site.city', 'Rabat')}, {t('site.country', 'Morocco')}
      </p>
      <p className="text-muted text-sm">{t('footer.platform', 'Digital rental platform')}</p>
    </footer>
  );
}
