import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolDetailPage } from '@/components/tool-detail';
import { getCatalog, getCatalogItem, isIndexableItem } from '@/lib/catalog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItem(slug);
  if (!item) return { title: '组件未找到 - AI 百宝箱' };
  const title = `${item.name}：功能与接入说明｜AI 百宝箱`;
  const description = `${item.description} 查看认证方式、快速接入、使用场景与官方资料。`;
  return {
    title, description,
    robots: { index: isIndexableItem(item), follow: true },
    alternates: { canonical: `/tool/${slug}`, languages: { 'zh-CN': `/tool/${slug}`, en: `/en/tool/${slug}`, 'x-default': `/tool/${slug}` } },
    openGraph: { title, description, url: `/tool/${slug}`, type: 'article', locale: 'zh_CN', alternateLocale: ['en_US'], images: [] },
    twitter: { card: 'summary', title, description, images: [] },
  };
}

export default async function ToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [item, catalog] = await Promise.all([getCatalogItem(slug), getCatalog()]);
  if (!item) notFound();
  return <ToolDetailPage item={item} alternatives={catalog.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug).sort((a, b) => Number(isIndexableItem(b)) - Number(isIndexableItem(a))).slice(0, 3)} locale="zh" />;
}
