import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SolutionDetailPage } from '@/components/solution-detail';
import { getCatalog } from '@/lib/catalog';
import { getScenario, scenarios } from '@/lib/scenarios';

export function generateStaticParams() {
  return scenarios.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) return { title: '方案未找到 - AI 百宝箱' };
  const title = `${scenario.title.zh}：架构、工具组合与开发样例｜AI 百宝箱`;
  return {
    title, description: scenario.summary.zh,
    alternates: { canonical: `/solution/${slug}`, languages: { 'zh-CN': `/solution/${slug}`, en: `/en/solution/${slug}`, 'x-default': `/solution/${slug}` } },
    openGraph: { title, description: scenario.summary.zh, url: `/solution/${slug}`, type: 'article', locale: 'zh_CN', alternateLocale: ['en_US'], images: [] },
    twitter: { card: 'summary', title, description: scenario.summary.zh, images: [] },
  };
}

export default async function SolutionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) notFound();
  return <SolutionDetailPage scenario={scenario} catalog={await getCatalog()} locale="zh" />;
}
