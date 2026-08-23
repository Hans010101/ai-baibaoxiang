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
  if (!scenario) return { title: 'Solution not found - AI Toolbox' };
  const title = `${scenario.title.en}: Architecture, Tool Stack & Code Sample | AI Toolbox`;
  return {
    title, description: scenario.summary.en,
    alternates: { canonical: `/en/solution/${slug}`, languages: { 'zh-CN': `/solution/${slug}`, en: `/en/solution/${slug}`, 'x-default': `/solution/${slug}` } },
    openGraph: { title, description: scenario.summary.en, url: `/en/solution/${slug}`, type: 'article', locale: 'en_US', alternateLocale: ['zh_CN'], images: [] },
    twitter: { card: 'summary', title, description: scenario.summary.en, images: [] },
  };
}

export default async function EnglishSolutionDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) notFound();
  return <SolutionDetailPage scenario={scenario} catalog={await getCatalog()} locale="en" />;
}
