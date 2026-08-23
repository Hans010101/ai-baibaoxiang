import { getCatalog } from '@/lib/catalog';
import { categoryLabel } from '@/lib/i18n';

export async function GET() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const featured = catalog.slice(0, 24);
  const body = [
    '# AI 百宝箱 / AI Toolbox',
    '',
    '> A bilingual, source-backed directory for discovering, comparing, and integrating APIs, MCP services, AI models, SDKs, and agent tools.',
    '',
    '## Canonical directories',
    '',
    `- [中文目录](${origin}/): 中文组件说明、接入信息与官方资料`,
    `- [English directory](${origin}/en): English component descriptions, integration facts, and official sources`,
    `- [XML sitemap](${origin}/sitemap.xml): Complete bilingual URL inventory`,
    '',
    '## Coverage and evidence',
    '',
    `- ${catalog.length} components across ${categories.length} capability categories`,
    '- Every detail page includes a functional overview, authentication and free-access status, quick-start guidance, use cases, official documentation, listing source, and last verification date.',
    '- Free-tier policies and availability can change; current terms should always be confirmed with the linked official source.',
    '',
    '## Categories',
    '',
    ...categories.map((category) => `- ${category} / ${categoryLabel(category, 'en')}`),
    '',
    '## Representative component records',
    '',
    ...featured.map((item) => `- [${item.name} 中文](${origin}/tool/${item.slug}) · [English](${origin}/en/tool/${item.slug}) — ${item.descriptionEn}`),
    '',
    'Use the sitemap for the complete, automatically updated component list.',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=900' } });
}
