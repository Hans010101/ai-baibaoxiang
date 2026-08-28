import catalogData from '@/data/catalog.json';

type CatalogRecord = (typeof catalogData)[number];
export type CatalogItem = CatalogRecord & {
  sourceCategory?: string;
  https?: string;
  cors?: string;
};
const bundledCatalog = catalogData as CatalogItem[];
const feedUrl = 'https://raw.githubusercontent.com/Hans010101/ai-baibaoxiang/main/data/catalog.json';

function isCatalog(value: unknown): value is CatalogItem[] {
  if (!Array.isArray(value) || !value.length) return false;
  const slugs = new Set<string>();
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const record = item as Record<string, unknown>;
    if (typeof record.slug !== 'string' || slugs.has(record.slug) || typeof record.name !== 'string' || typeof record.descriptionEn !== 'string' || typeof record.officialUrl !== 'string') return false;
    slugs.add(record.slug);
    return true;
  });
}

export async function getCatalog() {
  try {
    const response = await fetch(feedUrl, { next: { revalidate: 900 } });
    if (response.ok) {
      const remote = await response.json();
      if (isCatalog(remote)) return remote;
    }
  } catch { /* use the bundled catalog when GitHub is temporarily unavailable */ }
  return bundledCatalog;
}

export async function getCatalogItem(slug: string) {
  return (await getCatalog()).find((item) => item.slug === slug);
}

export function getCatalogOverview(catalog: CatalogItem[], limit = 48) {
  const verified = catalog.filter((item) => item.status === '已验证');
  const categoryCounts = Object.fromEntries([...new Set(catalog.map((item) => item.category))].sort().map((category) => [category, catalog.filter((item) => item.category === category).length]));
  const selected = [...verified];
  for (const category of Object.keys(categoryCounts)) {
    const representative = catalog.find((item) => item.category === category && !selected.some((entry) => entry.slug === item.slug));
    if (representative) selected.push(representative);
  }
  for (const item of catalog) {
    if (selected.length >= limit) break;
    if (!selected.some((entry) => entry.slug === item.slug)) selected.push(item);
  }
  return { items: selected.slice(0, limit), categories: Object.keys(categoryCounts), categoryCounts, totalCount: catalog.length, verifiedCount: verified.length };
}

export function isIndexableItem(item: CatalogItem) {
  return item.status === '已验证';
}
