import catalogData from '@/data/catalog.json';

export type CatalogItem = (typeof catalogData)[number];
export const catalog = catalogData as CatalogItem[];

export function getCatalogItem(slug: string) {
  return catalog.find((item) => item.slug === slug);
}

export const categories = [...new Set(catalog.map((item) => item.category))].sort();
