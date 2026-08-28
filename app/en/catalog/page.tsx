import type { Metadata } from 'next';
import { CatalogDirectory } from '@/components/catalog-directory';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'AI Component Directory & Server-side Search | AI Toolbox',
  description: 'Search APIs, MCP services, AI models, SDKs, and agent tools with verification status, authentication details, and official sources.',
  alternates: { canonical: '/en/catalog', languages: { 'zh-CN': '/catalog', en: '/en/catalog', 'x-default': '/catalog' } },
};

export default async function EnglishCatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <CatalogDirectory catalog={await getCatalog()} locale="en" query={typeof params.q === 'string' ? params.q : ''} category={typeof params.category === 'string' ? params.category : ''} verified={params.verified === '1'} page={typeof params.page === 'string' ? Number(params.page) || 1 : 1} />;
}
