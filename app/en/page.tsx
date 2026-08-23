import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/catalog-explorer';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'AI Toolbox - Find, understand, and integrate every AI capability',
  description: 'Discover free APIs, MCP services, AI models, SDKs, and agent tools with English guides, integration examples, and official links.',
  alternates: { canonical: '/en', languages: { 'zh-CN': '/', en: '/en' } },
  openGraph: { title: 'AI Toolbox - AI Component Directory', description: 'Find, understand, and integrate every AI capability.', locale: 'en_US' },
};

export default async function EnglishHome() {
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const items = catalog.map(({ slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }) => (
    { slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} locale="en" />;
}
