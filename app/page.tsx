import { CatalogExplorer } from '@/components/catalog-explorer';
import { getCatalog } from '@/lib/catalog';

export default async function Home() {
  const catalog = await getCatalog();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const items = catalog.map(({ slug, name, initial, type, category, description, auth, free, status, accent, tags, officialUrl }) => (
    { slug, name, initial, type, category, description, auth, free, status, accent, tags, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} />;
}
