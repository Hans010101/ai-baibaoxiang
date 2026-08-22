import catalogData from '@/data/catalog.json';

type CatalogRecord = (typeof catalogData)[number];
export type CatalogItem = CatalogRecord & {
  sourceCategory?: string;
  https?: string;
  cors?: string;
};
export const catalog = catalogData as CatalogItem[];

export function getCatalogItem(slug: string) {
  return catalog.find((item) => item.slug === slug);
}

export const categories = [...new Set(catalog.map((item) => item.category))].sort();
