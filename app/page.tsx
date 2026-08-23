import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/catalog-explorer';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = { alternates: { canonical: '/', languages: { 'zh-CN': '/', en: '/en' } } };

export default async function Home() {
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const items = catalog.map(({ slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }) => (
    { slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} />;
}
