import catalogData from '@/data/catalog.json';

type CatalogRecord = (typeof catalogData)[number];
export type CatalogItem = CatalogRecord & {
  sourceCategory?: string;
  https?: string;
  cors?: string;
};
const bundledCatalog = catalogData as CatalogItem[];
const feedUrl = 'https://raw.githubusercontent.com/Hans010101/ai-baibaoxiang/main/data/catalog.json';

export async function getCatalog() {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 900 } });
    if (response.ok) {
      const remote = await response.json();
      if (Array.isArray(remote) && remote.length) return remote as CatalogItem[];
    }
  } catch { /* use the bundled catalog when GitHub is temporarily unavailable */ }
  return bundledCatalog;
}

export async function getCatalogItem(slug: string) {
  return (await getCatalog()).find((item) => item.slug === slug);
}
