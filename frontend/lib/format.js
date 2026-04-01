import { getLangLocale, normalizeLang } from '@/lib/i18n';

export const STATUS_LABELS = {
  available: 'متاح',
  rented: 'مؤجر',
  maintenance: 'صيانة',
  reserved: 'محجوز',
  retired: 'متوقف',
  pending: 'معلق',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  active: 'نشط',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const STATUS_VARIANTS = {
  available: 'badge-ok',
  approved: 'badge-ok',
  active: 'badge-ok',
  rented: 'badge-warn',
  pending: 'badge-warn',
  reserved: 'badge-info',
  completed: 'badge-neutral',
  maintenance: 'badge-danger',
  rejected: 'badge-danger',
  retired: 'badge-danger',
  cancelled: 'badge-danger',
};

export function formatMoney(value, lang = 'ar') {
  const amount = Number(value || 0);
  return amount.toLocaleString(getLangLocale(normalizeLang(lang)));
}

export function formatDate(value, lang = 'ar') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(getLangLocale(normalizeLang(lang)), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function truncateText(text, limit = 110) {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}
