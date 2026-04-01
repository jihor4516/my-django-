import ar from '@/locales/ar.json';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

export const SUPPORTED_LANGS = ['ar', 'fr', 'en'];

const DICTIONARIES = { ar, fr, en };

export function normalizeLang(value) {
  const lang = String(value || '').toLowerCase();
  return SUPPORTED_LANGS.includes(lang) ? lang : 'ar';
}

export function isRtlLanguage(lang) {
  const current = normalizeLang(lang);
  return current === 'ar';
}

export function getMessages(lang) {
  return DICTIONARIES[normalizeLang(lang)] || DICTIONARIES.ar;
}

export function translate(messages, key, fallback = '') {
  if (!messages || !key) return fallback || key;
  const resolved = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), messages);
  return resolved !== undefined ? resolved : (fallback || key);
}

export function getLangLocale(lang) {
  const current = normalizeLang(lang);
  if (current === 'en') return 'en-US';
  if (current === 'fr') return 'fr-FR';
  return 'ar-MA';
}
