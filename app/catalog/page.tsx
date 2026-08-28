import type { Metadata } from 'next';
import { CatalogDirectory } from '@/components/catalog-directory';
import { getCatalog } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'AI 组件完整目录与服务端搜索｜AI 百宝箱',
  description: '搜索和筛选 API、MCP、AI 模型、SDK 与智能体工具；核对验证状态、认证方式和官方来源。',
  alternates: { canonical: '/catalog', languages: { 'zh-CN': '/catalog', en: '/en/catalog', 'x-default': '/catalog' } },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <CatalogDirectory catalog={await getCatalog()} locale="zh" query={typeof params.q === 'string' ? params.q : ''} category={typeof params.category === 'string' ? params.category : ''} verified={params.verified === '1'} page={typeof params.page === 'string' ? Number(params.page) || 1 : 1} />;
}
