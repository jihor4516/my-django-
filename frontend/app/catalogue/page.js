import Link from 'next/link';
import { cookies } from 'next/headers';
import EmptyState from '@/components/ui/empty-state';
import StatusBadge from '@/components/ui/status-badge';
import { getCategories, getItems } from '@/lib/api';
import { resolveBackendFileUrl } from '@/lib/backend-url';
import { getMessages, normalizeLang, translate } from '@/lib/i18n';
import { truncateText } from '@/lib/format';

export const revalidate = 30;

function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      search.set(key, String(value));
    }
  });
  return search.toString();
}

export default async function CataloguePage({ searchParams }) {
  const cookieStore = cookies();
  const lang = normalizeLang(cookieStore.get('site_lang')?.value || 'ar');
  const messages = getMessages(lang);
  const t = (key, fallback = '') => translate(messages, key, fallback);

  const q = searchParams?.q || '';
  const cat = searchParams?.cat || '';
  const status = searchParams?.status || '';
  const page = Number(searchParams?.page || 1);

  let itemsData = { results: [], count: 0, num_pages: 1 };
  let categoriesData = { results: [] };
  let loadError = '';

  try {
    [itemsData, categoriesData] = await Promise.all([
      getItems({ lang, q, cat, status, page }),
      getCategories(lang),
    ]);
  } catch (error) {
    loadError = t('catalogue.loadError', 'Unable to load catalogue data.');
  }

  const items = itemsData.results || [];
  const categories = categoriesData.results || [];
  const total = itemsData.count || 0;
  const totalPages = itemsData.num_pages || 1;

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{t('catalogue.eyebrow', 'Digital Store')}</p>
        <h1>{t('catalogue.title', 'Browse products')}</h1>
        <p className="text-muted">{t('catalogue.subtitle', '')}</p>
      </section>

      <form action="/catalogue" method="get" className="filterbar" style={{ marginTop: '16px' }}>
        <input name="q" defaultValue={q} className="input" placeholder={t('catalogue.searchPlaceholder', 'Search')} />
        <select name="cat" defaultValue={cat} className="input">
          <option value="">{t('catalogue.allCategories', 'All Categories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>{category.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="input">
          <option value="">{t('catalogue.allStatuses', 'All Statuses')}</option>
          <option value="available">{t('catalogue.available', 'Available')}</option>
          <option value="reserved">{t('catalogue.reserved', 'Reserved')}</option>
          <option value="rented">{t('catalogue.rented', 'Rented')}</option>
          <option value="maintenance">{t('catalogue.maintenance', 'Maintenance')}</option>
        </select>
        <button type="submit" className="btn btn-primary">{t('catalogue.filter', 'Filter')}</button>
        {(q || cat || status) ? <Link href="/catalogue" className="btn btn-ghost">{t('catalogue.cancel', 'Clear')}</Link> : null}
      </form>

      <section className="section-block mt-4">
        <div className="section-header">
          <div>
            <p className="section-label">{t('catalogue.results', 'Results')}</p>
            <h2>{total} {t('catalogue.productsCount', 'products')}</h2>
          </div>
        </div>

        {loadError ? (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{loadError}</div>
        ) : null}

        {items.length === 0 ? (
          <EmptyState
            icon="⌕"
              title={t('catalogue.noResultsTitle', 'No results')}
              description={t('catalogue.noResultsDesc', '')}
            actionHref="/catalogue"
              actionLabel={t('catalogue.showAll', 'Show all products')}
          />
        ) : (
          <div className="grid grid-4">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="product-card card-link">
                <div className="product-thumb">
                  {item.main_image ? <img src={resolveBackendFileUrl(item.main_image)} alt={item.name} /> : <span className="thumb-placeholder">◦</span>}
                </div>
                <div className="product-body">
                  <p className="product-cat">{item.category?.name}</p>
                  <h3 className="product-name">{item.name}</h3>
                  <p className="text-muted text-sm">{truncateText(item.description, 100)}</p>
                </div>
                <div className="product-footer">
                  <StatusBadge status={item.status} />
                  <small className="text-muted">{item.quantity_available} {t('catalogue.availableShort', 'available')}</small>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="row-actions" style={{ justifyContent: 'center', marginTop: '28px' }}>
            {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 7).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={`/catalogue?${queryString({ q, cat, status, page: pageNumber })}`}
                className={`btn btn-sm ${pageNumber === page ? 'btn-primary' : 'btn-ghost'}`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
