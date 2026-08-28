import type { MetadataRoute } from 'next';
import { getCatalog, isIndexableItem } from '@/lib/catalog';
import { scenarios } from '@/lib/scenarios';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const catalog = await getCatalog();
  const homeLanguages = { 'zh-CN': `${origin}/`, en: `${origin}/en`, 'x-default': `${origin}/` };
  const catalogLanguages = { 'zh-CN': `${origin}/catalog`, en: `${origin}/en/catalog`, 'x-default': `${origin}/catalog` };
  const methodologyLanguages = { 'zh-CN': `${origin}/methodology`, en: `${origin}/en/methodology`, 'x-default': `${origin}/methodology` };
  return [
    { url: `${origin}/`, changeFrequency: 'daily' as const, priority: 1, alternates: { languages: homeLanguages } },
    { url: `${origin}/en`, changeFrequency: 'daily' as const, priority: 1, alternates: { languages: homeLanguages } },
    { url: catalogLanguages['zh-CN'], changeFrequency: 'daily' as const, priority: 0.9, alternates: { languages: catalogLanguages } },
    { url: catalogLanguages.en, changeFrequency: 'daily' as const, priority: 0.9, alternates: { languages: catalogLanguages } },
    { url: methodologyLanguages['zh-CN'], changeFrequency: 'monthly' as const, priority: 0.5, alternates: { languages: methodologyLanguages } },
    { url: methodologyLanguages.en, changeFrequency: 'monthly' as const, priority: 0.5, alternates: { languages: methodologyLanguages } },
    ...scenarios.flatMap((scenario) => {
      const languages = { 'zh-CN': `${origin}/solution/${scenario.slug}`, en: `${origin}/en/solution/${scenario.slug}`, 'x-default': `${origin}/solution/${scenario.slug}` };
      return [
        { url: languages['zh-CN'], changeFrequency: 'monthly' as const, priority: 0.8, alternates: { languages } },
        { url: languages.en, changeFrequency: 'monthly' as const, priority: 0.8, alternates: { languages } },
      ];
    }),
    ...catalog.filter(isIndexableItem).flatMap((item) => {
      const languages = { 'zh-CN': `${origin}/tool/${item.slug}`, en: `${origin}/en/tool/${item.slug}`, 'x-default': `${origin}/tool/${item.slug}` };
      return [
        { url: languages['zh-CN'], lastModified: item.verifiedAt, changeFrequency: 'weekly' as const, priority: 0.7, alternates: { languages } },
        { url: languages.en, lastModified: item.verifiedAt, changeFrequency: 'weekly' as const, priority: 0.7, alternates: { languages } },
      ];
    }),
  ];
}
