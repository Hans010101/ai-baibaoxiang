import { CatalogExplorer } from '@/components/catalog-explorer';
import { catalog, categories } from '@/lib/catalog';

export default function Home() {
  return <CatalogExplorer items={catalog} categories={categories} />;
}
