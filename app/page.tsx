import { CatalogExplorer } from '@/components/catalog-explorer';
import { catalog, categories } from '@/lib/catalog';

export default function Home() {
  const items = catalog.map(({ slug, name, initial, type, category, description, auth, free, status, accent, tags, officialUrl }) => (
    { slug, name, initial, type, category, description, auth, free, status, accent, tags, officialUrl }
  ));
  return <CatalogExplorer items={items} categories={categories} />;
}
