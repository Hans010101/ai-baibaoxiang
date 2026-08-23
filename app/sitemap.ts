import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const catalog = await getCatalog();
  const homeLanguages = { 'zh-CN': `${origin}/`, en: `${origin}/en`, 'x-default': `${origin}/` };
  return [
    { url: `${origin}/`, changeFrequency: 'daily' as const, priority: 1, alternates: { languages: homeLanguages } },
    { url: `${origin}/en`, changeFrequency: 'daily' as const, priority: 1, alternates: { languages: homeLanguages } },
    ...catalog.flatMap((item) => {
      const languages = { 'zh-CN': `${origin}/tool/${item.slug}`, en: `${origin}/en/tool/${item.slug}`, 'x-default': `${origin}/tool/${item.slug}` };
      return [
        { url: languages['zh-CN'], lastModified: item.verifiedAt, changeFrequency: 'weekly' as const, priority: 0.7, alternates: { languages } },
        { url: languages.en, lastModified: item.verifiedAt, changeFrequency: 'weekly' as const, priority: 0.7, alternates: { languages } },
      ];
    }),
  ];
}
