import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/catalog-explorer';
import { getCatalog } from '@/lib/catalog';

const description = 'Discover and compare free APIs, MCP services, AI models, SDKs, and agent tools with free-tier details, authentication, integration examples, use cases, and official sources.';

export const metadata: Metadata = {
  title: 'AI Toolbox | Free APIs, MCP Services, AI Models & SDK Directory',
  description,
  alternates: { canonical: '/en', languages: { 'zh-CN': '/', en: '/en', 'x-default': '/' } },
  openGraph: {
    title: 'AI Toolbox | Free APIs, MCP Services, AI Models & SDK Directory', description, url: '/en',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI Toolbox' }], locale: 'en_US', alternateLocale: ['zh_CN'], type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'AI Toolbox | Free APIs, MCP Services, AI Models & SDK Directory', description, images: ['/og.png'] },
};

export default async function EnglishHome() {
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const items = catalog.map(({ slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }) => (
    { slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} locale="en" />;
}
