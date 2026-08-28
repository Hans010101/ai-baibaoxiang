import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolDetailPage } from '@/components/tool-detail';
import { getCatalog, getCatalogItem, isIndexableItem } from '@/lib/catalog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) return { title: 'Component not found - AI Toolbox' };
  const title = `${item.name}: Features & Integration Guide | AI Toolbox`;
  const description = `${item.descriptionEn} Review authentication, quick-start steps, use cases, and official sources.`;
  return {
    title, description,
    robots: { index: isIndexableItem(item), follow: true },
    alternates: { canonical: `/en/tool/${slug}`, languages: { 'zh-CN': `/tool/${slug}`, en: `/en/tool/${slug}`, 'x-default': `/tool/${slug}` } },
    openGraph: { title, description, url: `/en/tool/${slug}`, type: 'article', locale: 'en_US', alternateLocale: ['zh_CN'], images: [] },
    twitter: { card: 'summary', title, description, images: [] },
  };
}

export default async function EnglishToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, catalog] = await Promise.all([getCatalogItem(slug), getCatalog()]);
  if (!item) notFound();
  return <ToolDetailPage item={item} alternatives={catalog.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug).sort((a, b) => Number(isIndexableItem(b)) - Number(isIndexableItem(a))).slice(0, 3)} locale="en" />;
}
