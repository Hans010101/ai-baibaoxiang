import type { Metadata } from 'next';
import { CatalogExplorer } from '@/components/catalog-explorer';
import { getCatalog } from '@/lib/catalog';

const description = '发现并对比免费的 API、MCP 服务、AI 模型、SDK 与 Agent 工具，查看免费额度、认证方式、接入示例、使用场景和官方资料。';

export const metadata: Metadata = {
  title: 'AI 百宝箱｜免费 API、MCP、AI 模型与 SDK 工具导航',
  description,
  alternates: { canonical: '/', languages: { 'zh-CN': '/', en: '/en', 'x-default': '/' } },
  openGraph: {
    title: 'AI 百宝箱｜免费 API、MCP、AI 模型与 SDK 工具导航', description, url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI 百宝箱' }], locale: 'zh_CN', alternateLocale: ['en_US'], type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'AI 百宝箱｜免费 API、MCP、AI 模型与 SDK 工具导航', description, images: ['/og.png'] },
};

export default async function Home() {
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const items = catalog.map(({ slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }) => (
    { slug, name, initial, type, category, description, descriptionEn, auth, free, status, accent, tags, tagsEn, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} />;
}
