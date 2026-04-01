import HeroBanner from '@/components/home/hero-banner';
import ServiceHighlights from '@/components/home/service-highlights';
import CategoryGrid from '@/components/home/category-grid';
import FeaturedProducts from '@/components/home/featured-products';
import ProcessTimeline from '@/components/home/process-timeline';
import CtaPanel from '@/components/home/cta-panel';
import { cookies } from 'next/headers';
import { getCategories, getItems } from '@/lib/api';
import { normalizeLang } from '@/lib/i18n';

export const revalidate = 60;

export default async function HomePage() {
  const cookieStore = cookies();
  const lang = normalizeLang(cookieStore.get('site_lang')?.value || 'ar');

  let categories = [];
  let items = [];

  try {
    const [categoriesData, itemsData] = await Promise.all([
      getCategories(lang),
      getItems({ lang, status: 'available', page: 1 }),
    ]);
    categories = categoriesData.results || [];
    items = itemsData.results || [];
  } catch (_) {
    categories = [];
    items = [];
  }

  return (
    <>
      <HeroBanner categoriesCount={categories.length || 6} itemsCount={items.length || 20} />
      <ServiceHighlights />
      <CategoryGrid categories={categories} />
      <FeaturedProducts items={items.slice(0, 8)} />
      <ProcessTimeline />
      <CtaPanel />
    </>
  );
}
