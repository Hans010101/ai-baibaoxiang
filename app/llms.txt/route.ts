import { getCatalog, isIndexableItem } from '@/lib/catalog';
import { categoryLabel } from '@/lib/i18n';
import { scenarios } from '@/lib/scenarios';

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const verified = catalog.filter(isIndexableItem);
  const featured = verified.slice(0, 24);
  const body = [
    '# AI 百宝箱 / AI Toolbox',
    '',
    '> A bilingual, source-backed directory for discovering, comparing, and integrating APIs, MCP services, AI models, SDKs, and agent tools.',
    '',
    '## Canonical directories',
    '',
    `- [中文目录](${origin}/catalog): 中文组件说明、接入信息与官方资料`,
    `- [English directory](${origin}/en/catalog): English component descriptions, integration facts, and official sources`,
    `- [中文方案库](${origin}/#use-cases): ${scenarios.length} 个 AI 应用场景与开发参考方案`,
    `- [English solution library](${origin}/en#use-cases): ${scenarios.length} AI use cases with developer reference architectures`,
    `- [XML sitemap](${origin}/sitemap.xml): Complete bilingual URL inventory`,
    `- [数据方法与隐私](${origin}/methodology) · [Data methodology and privacy](${origin}/en/methodology)`,
    '',
    '## Coverage and evidence',
    '',
    `- ${catalog.length} discoverable records across ${categories.length} capability categories; ${verified.length} have completed the current verification checklist.`,
    '- Verified records link official documentation and show a verification date. Pending records are excluded from the sitemap and AI recommendations.',
    '- Free-access claims are shown as verified only after source review. Policies can change, so current terms should still be confirmed with the official source.',
    '',
    '## Categories',
    '',
    ...categories.map((category) => `- ${category} / ${categoryLabel(category, 'en')}`),
    '',
    '## Developer solution guides',
    '',
    ...scenarios.map((scenario) => `- [${scenario.title.zh}](${origin}/solution/${scenario.slug}) · [${scenario.title.en}](${origin}/en/solution/${scenario.slug}) — ${scenario.summary.en}`),
    '',
    '## Representative component records',
    '',
    ...featured.map((item) => `- [${item.name} 中文](${origin}/tool/${item.slug}) · [English](${origin}/en/tool/${item.slug}) — ${item.descriptionEn}`),
    '',
    'Use the catalog for discovery. The sitemap intentionally includes only records that meet the current indexing threshold.',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
}
