import { JsonLd, SiteFooter, SiteHeader } from '@/components/site-shell';
import { ToolLogo } from '@/components/tool-logo';
import type { CatalogItem } from '@/lib/catalog';
import { authLabel, categoryLabel, statusLabel, typeLabel, type Locale } from '@/lib/i18n';

const PAGE_SIZE = 48;

export function CatalogDirectory({ catalog, locale, query = '', category = '', verified = false, page = 1 }: { catalog: CatalogItem[]; locale: Locale; query?: string; category?: string; verified?: boolean; page?: number }) {
  const en = locale === 'en';
  const base = en ? '/en/catalog' : '/catalog';
  const normalized = query.trim().toLowerCase();
  const categories = [...new Set(catalog.map((item) => item.category))].sort();
  const filtered = catalog.filter((item) => {
    if (category && item.category !== category) return false;
    if (verified && item.status !== '已验证') return false;
    if (!normalized) return true;
    return [item.name, item.category, item.description, item.descriptionEn, ...item.tags, ...item.tagsEn].join(' ').toLowerCase().includes(normalized);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (verified) params.set('verified', '1');
    if (nextPage > 1) params.set('page', String(nextPage));
    return `${base}${params.size ? `?${params}` : ''}`;
  };
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';

  return (
    <main lang={en ? 'en' : 'zh-CN'}>
      <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: en ? 'AI component directory' : 'AI 组件目录', url: `${origin}${base}`, inLanguage: en ? 'en' : 'zh-CN', mainEntity: { '@type': 'ItemList', numberOfItems: filtered.length, itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: (currentPage - 1) * PAGE_SIZE + index + 1, name: item.name, url: `${origin}${en ? '/en' : ''}/tool/${item.slug}` })) } }} />
      <SiteHeader locale={locale} />
      <div className="directory-wrap">
        <div className="directory-heading"><span className="section-kicker">{en ? 'DIRECTORY' : '完整目录'}</span><h1>{en ? 'Search AI components' : '搜索 AI 组件'}</h1><p>{en ? 'Search and filter on the server without downloading the full catalog.' : '在服务端完成搜索和筛选，无需向浏览器下载完整目录。'}</p></div>
        <form className="directory-form" action={base} method="get">
          <label><span>{en ? 'Keyword' : '关键词'}</span><input type="search" name="q" defaultValue={query} placeholder={en ? 'Name, capability, or use case' : '名称、能力或使用场景'} /></label>
          <label><span>{en ? 'Category' : '能力分类'}</span><select name="category" defaultValue={category}><option value="">{en ? 'All categories' : '全部分类'}</option>{categories.map((name) => <option key={name} value={name}>{categoryLabel(name, locale)}</option>)}</select></label>
          <label className="directory-check"><input type="checkbox" name="verified" value="1" defaultChecked={verified} /><span>{en ? 'Verified only' : '仅看已验证'}</span></label>
          <button type="submit">{en ? 'Search' : '搜索'}</button>
        </form>
        <div className="directory-result"><strong>{filtered.length}</strong> {en ? 'matching components' : '个匹配组件'}{(query || category || verified) && <a href={base}>{en ? 'Clear filters' : '清除筛选'}</a>}</div>
        {items.length ? <div className="tool-grid">{items.map((tool) => {
          const isVerified = tool.status === '已验证';
          return <article className="tool-card" key={tool.slug}>
            <div className="tool-top"><ToolLogo {...tool} className="tool-icon" /><div className="tool-title"><h2>{tool.name}</h2><span className="type">{typeLabel(tool.type, locale)} · {categoryLabel(tool.category, locale)}</span></div><span className={isVerified ? 'verified' : 'pending'}>{isVerified ? '✓' : '◷'} {statusLabel(tool.status, locale)}</span></div>
            <p>{en ? tool.descriptionEn : tool.description}</p>
            <div className="card-actions"><div className="tags"><span>{authLabel(tool.auth, locale)}</span><span>{isVerified && tool.free ? (en ? 'Free tier verified' : '已核验免费信息') : (en ? 'Terms pending review' : '政策待核实')}</span></div><a href={`${en ? '/en' : ''}/tool/${tool.slug}`}>{en ? 'View evidence' : '查看证据'} <b>→</b></a></div>
          </article>;
        })}</div> : <div className="empty-state"><span>⌕</span><h2>{en ? 'No matching components' : '没有匹配的组件'}</h2><p>{en ? 'Try fewer words or clear the filters.' : '试试减少关键词或清除筛选。'}</p></div>}
        {pageCount > 1 && <nav className="pagination" aria-label={en ? 'Directory pages' : '目录分页'}>{currentPage > 1 && <a href={href(currentPage - 1)}>← {en ? 'Previous' : '上一页'}</a>}<span>{currentPage} / {pageCount}</span>{currentPage < pageCount && <a href={href(currentPage + 1)}>{en ? 'Next' : '下一页'} →</a>}</nav>}
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
