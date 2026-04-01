'use client';

import { useLanguage } from '@/components/i18n/language-provider';
import { STATUS_LABELS, STATUS_VARIANTS } from '@/lib/format';

export default function StatusBadge({ status, label }) {
  const className = STATUS_VARIANTS[status] || 'badge-neutral';
  const { t } = useLanguage();
  const translatedStatus = t(`status.${status}`, STATUS_LABELS[status] || status || '—');
  const resolvedLabel = label || translatedStatus;

  return <span className={`badge ${className}`}>{resolvedLabel}</span>;
}
