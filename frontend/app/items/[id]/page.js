'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatusBadge from '@/components/ui/status-badge';
import { useLanguage } from '@/components/i18n/language-provider';
import { createRentalRequest } from '@/lib/client-api';
import { getApiBase, resolveBackendFileUrl } from '@/lib/backend-url';
import { truncateText } from '@/lib/format';

const initialForm = {
  qty: 1,
  event_name: '',
  venue: '',
  start_date: '',
  end_date: '',
  note: '',
};

export default function ItemDetailPage({ params }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [item, setItem] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${getApiBase()}/items/${params.id}/?lang=${lang}`);
        if (!response.ok) {
          throw new Error(t('item.notFound', 'Product not found'));
        }
        const data = await response.json();
        const resolvedImages = (data.images || []).map((image) => resolveBackendFileUrl(image)).filter(Boolean);
        const fallbackImage = resolveBackendFileUrl(data.main_image);
        setItem({ ...data, images: resolvedImages });
        setActiveImage(resolvedImages[0] || fallbackImage || '');

        if (data.category?.slug) {
          const relatedResponse = await fetch(`${getApiBase()}/items/?lang=${lang}&cat=${encodeURIComponent(data.category.slug)}&page=1`);
          const relatedData = await relatedResponse.json();
          setRelatedItems((relatedData.results || []).filter((entry) => entry.id !== data.id).slice(0, 4));
        }
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [params.id, lang, t]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const result = await createRentalRequest({
        item_id: item.id,
        qty: Number(form.qty),
        event_name: form.event_name,
        venue: form.venue,
        start_date: form.start_date,
        end_date: form.end_date,
        note: form.note,
      });
      setMessage(result.detail || t('item.requestSent', 'Request submitted successfully'));
      setForm(initialForm);
      setTimeout(() => router.push('/tenant-dashboard'), 1400);
    } catch (requestError) {
      if (requestError.status === 401 || requestError.status === 403) {
        router.push(`/login?next=/items/${params.id}`);
        return;
      }
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner" /><span>{t('item.loading', 'Loading product...')}</span></div>;
  }

  if (!item) {
    return (
      <div className="card empty-state">
        <div className="empty-state-icon">!</div>
        <h3>{error || t('item.notFound', 'Product unavailable')}</h3>
        <Link href="/catalogue" className="btn btn-primary">{t('item.backToCatalogue', 'Back to catalogue')}</Link>
      </div>
    );
  }

  const available = item.status === 'available' && item.quantity_available > 0;

  return (
    <>
      <nav className="text-sm text-muted" style={{ marginTop: '12px', marginBottom: '20px' }}>
        <Link href="/">{t('item.breadcrumbHome', 'Home')}</Link> / <Link href="/catalogue">{t('item.breadcrumbProducts', 'Products')}</Link> / <span className="text-accent">{item.name}</span>
      </nav>

      <div className="item-layout">
        <section>
          <div className="item-gallery">
            {activeImage ? <img src={activeImage} alt={item.name} /> : <span>◦</span>}
          </div>

          {item.images?.length > 1 ? (
            <div className="thumb-grid">
              {item.images.map((source, index) => {
                return (
                  <button key={source} type="button" className={`thumb-img ${activeImage === source ? 'active' : ''}`} onClick={() => setActiveImage(source)}>
                    <img src={source} alt={`${item.name} ${index + 1}`} />
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="section-block mt-4">
            <p className="product-cat">{item.category?.name}</p>
            <h1>{item.name}</h1>
            <div className="row-actions mt-4">
              <StatusBadge status={item.status} />
              <span className="text-muted text-sm">{t('item.available', 'Available')}: {item.quantity_available} / {item.quantity_total}</span>
            </div>
            <p className="text-muted" style={{ marginTop: '18px' }}>{item.description || '-'}</p>
            <div className="item-specs">
              <span>{t('item.serial', 'Serial')}: {item.serial_number}</span>
              <span>{t('item.totalQty', 'Total quantity')}: {item.quantity_total}</span>
            </div>
          </div>
        </section>

        <aside className="request-box">
          <div className="alert alert-ok">{t('item.requestBoxTitle', 'يمكنك إرسال طلب الإيجار مباشرة، وسيظهر لك تنزيل العقد بعد موافقة الإدارة.')}</div>

          {!available ? <div className="alert alert-warn">{t('item.unavailableBox', 'This item is unavailable now.')}</div> : null}

          {available ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">{t('item.qty', 'Quantity')}</label>
                <input className="input" type="number" min="1" max={item.quantity_available} value={form.qty} onChange={(e) => updateField('qty', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('item.eventName', 'Event name')}</label>
                <input className="input" value={form.event_name} onChange={(e) => updateField('event_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">{t('item.venue', 'Venue')}</label>
                <input className="input" value={form.venue} onChange={(e) => updateField('venue', e.target.value)} />
              </div>
              <div className="form-grid cols-2">
                <div className="form-group">
                  <label className="form-label">{t('item.startDate', 'Start date')}</label>
                  <input className="input" type="date" value={form.start_date} onChange={(e) => updateField('start_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('item.endDate', 'End date')}</label>
                  <input className="input" type="date" value={form.end_date} onChange={(e) => updateField('end_date', e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('item.notes', 'Notes')}</label>
                <textarea className="input" rows="4" value={form.note} onChange={(e) => updateField('note', e.target.value)} />
              </div>
              {message ? <div className="alert alert-ok">{message}</div> : null}
              {error ? <div className="alert alert-danger">{error}</div> : null}
              <button type="submit" className="btn btn-primary full-width" disabled={submitting}>{submitting ? t('item.submitting', 'Submitting...') : t('item.submit', 'Rent')}</button>
            </form>
          ) : (
            <Link href="/catalogue?status=available" className="btn btn-primary full-width">{t('item.browseAvailable', 'Browse available')}</Link>
          )}
        </aside>
      </div>

      {relatedItems.length ? (
        <section className="section-block">
          <div className="section-header">
            <div>
              <p className="section-label">{t('item.relatedLabel', 'Related products')}</p>
              <h2>{t('item.relatedTitle', 'You may also like')}</h2>
            </div>
          </div>
          <div className="grid grid-4">
            {relatedItems.map((related) => (
              <Link key={related.id} href={`/items/${related.id}`} className="product-card card-link">
                <div className="product-thumb">
                  {related.main_image ? <img src={resolveBackendFileUrl(related.main_image)} alt={related.name} /> : <span className="thumb-placeholder">◦</span>}
                </div>
                <div className="product-body">
                  <p className="product-cat">{related.category?.name}</p>
                  <h3 className="product-name">{related.name}</h3>
                  <p className="text-muted text-sm">{truncateText(related.description, 80)}</p>
                </div>
                <div className="product-footer">
                  <StatusBadge status={related.status} />
                  <small className="text-muted">{related.quantity_available} {t('catalogue.availableShort', 'available')}</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
