import type { CatalogItem } from '@/lib/catalog';

export function ToolLogo({ initial, accent, className }: Pick<CatalogItem, 'initial' | 'accent'> & { className: string }) {
  return <span className={`tool-logo ${className}`} style={{ background: accent }} aria-hidden="true">{initial}</span>;
}
