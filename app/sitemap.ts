import type { MetadataRoute } from 'next';
import { getCatalog } from '@/lib/catalog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const catalog = await getCatalog();
  return ['/', '/en', ...catalog.flatMap((item) => [`/tool/${item.slug}`, `/en/tool/${item.slug}`])]
    .map((path) => ({ url: `${origin}${path}`, changeFrequency: path.includes('/tool/') ? 'weekly' : 'daily' }));
}
