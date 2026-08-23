import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolDetailPage } from '@/components/tool-detail';
import { getCatalog, getCatalogItem } from '@/lib/catalog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) return { title: 'Component not found - AI Toolbox' };
  return { title: `${item.name}: features, free tier, and integration guide - AI Toolbox`, description: item.descriptionEn, alternates: { canonical: `/en/tool/${slug}`, languages: { 'zh-CN': `/tool/${slug}`, en: `/en/tool/${slug}` } } };
}

export default async function EnglishToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, catalog] = await Promise.all([getCatalogItem(slug), getCatalog()]);
  if (!item) notFound();
  return <ToolDetailPage item={item} alternatives={catalog.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug).slice(0, 3)} locale="en" />;
}
