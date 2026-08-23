/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '@/lib/catalog';
import { authLabel, categoryLabel, statusLabel, typeLabel, type Locale } from '@/lib/i18n';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

const typeIcons: Record<string, string> = { API: '⌁', MCP: '⋈', 模型: '◈', SDK: '{ }' };
const categoryIcons: Record<string, string> = {
  '智能体框架': '⌁', 'MCP 服务': '⋈', '云存储与文件': '▤', '公共数据': '▦',
  '动漫与娱乐': '◉', '动物与自然': '♧', '区块链与加密': '⬡', '商业与金融': '↗',
  '天气与地理': '◎', '安全与认证': '◇', '开发者工具': '{ }', '政府与社会': '⚖',
  '数据与校验': '✓', '新闻与媒体': '◫', '日历与活动': '□', '模型与推理': '∑',
  '模型与文本': '¶', '游戏与体育': '◆', '知识与内容': '≡', '科学与健康': '+',
  '科学与研究': '⌬', '网络服务': '⌘', '艺术与设计': '✦', '邮件与通信': '@',
  '金融数据': '%', '音乐与视频': '♫',
};
const PAGE_SIZE = 48;
export type ExplorerItem = Pick<CatalogItem, 'slug' | 'name' | 'initial' | 'type' | 'category' | 'description' | 'auth' | 'free' | 'status' | 'accent' | 'tags' | 'officialUrl'>;
type BilingualExplorerItem = ExplorerItem & Pick<CatalogItem, 'descriptionEn' | 'tagsEn'>;

export function ToolLogo({ name, initial, officialUrl, accent, className, locale = 'zh' }: Pick<CatalogItem, 'name' | 'initial' | 'officialUrl' | 'accent'> & { className: string; locale?: Locale }) {
  const [failed, setFailed] = useState(false);
  let logoUrl = '';
  try { logoUrl = `${new URL(officialUrl).origin}/favicon.ico`; } catch { /* invalid source falls back to the initial */ }

  return (
    <span className={`tool-logo ${className}`} style={{ background: accent }}>
      <span aria-hidden="true">{initial}</span>
      {!failed && logoUrl && <img src={logoUrl} alt={`${name} ${locale === 'en' ? 'official logo' : '官方标识'}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
    </span>
  );
}

export function CatalogExplorer({ items, categories, locale = 'zh' }: { items: BilingualExplorerItem[]; categories: string[]; locale?: Locale }) {
  const en = locale === 'en';
  const copy = en ? {
    all: 'All', verified: 'Verified', pending: 'Pending review', free: 'Free tier', paid: 'Paid',
    eyebrow: 'The continuously updated AI component directory', title: <>Find, understand, and integrate<br /><em>every AI capability.</em></>,
    subtitle: 'APIs, MCP services, models, SDKs, and agent tools—all in one place.', placeholder: 'What capability does your product need?', search: 'Search',
    collected: 'components listed', categories: 'capability categories', verifiedCount: 'verified and available', daily: 'Daily updates', schedule: 'Runs automatically at 00:20 UTC',
    explore: 'EXPLORE', browse: 'Browse by capability', browseNote: 'Start with the need, even if you do not know the tool name', components: 'components',
    catalog: 'CATALOG', componentCatalog: 'Component catalog', found: 'components found', clear: 'Clear', details: 'View integration guide',
    emptyTitle: 'No matching components yet', emptyText: 'Try a shorter keyword or clear the filters.', viewAll: 'View all components', loadMore: 'Load', more: 'more components',
    trusted: 'TRUSTED DATA', trustedTitle: 'Every entry links back to its source.', trustedText: 'The system discovers new components daily and only publishes entries from official channels that pass schema validation. Unconfirmed availability and free tiers are clearly marked as pending review.',
    steps: [['Discovery & deduplication', 'Track public directories, official repositories, and product documentation'], ['Bilingual AI editing', 'Generate Chinese and English descriptions, tags, use cases, and quick-start guidance'], ['Evidence & availability checks', 'Keep official sites, documentation, sources, and last verification dates']],
  } : {
    all: '全部', verified: '已验证', pending: '待确认', free: '有免费额度', paid: '付费',
    eyebrow: '持续更新的 AI 组件黄页', title: <>找到、看懂、接入<br /><em>每一种 AI 能力。</em></>,
    subtitle: '开放接口、MCP、模型、开发工具包与智能体工具，一站查清。', placeholder: '你想给产品接入什么能力？', search: '搜索',
    collected: '已收录组件', categories: '能力分类', verifiedCount: '已验证可用', daily: '每日更新', schedule: '新加坡时间 08:20 自动运行',
    explore: '探索', browse: '按能力查找', browseNote: '从需求出发，不必先知道工具名字', components: '个组件',
    catalog: '目录', componentCatalog: '组件目录', found: '个组件', clear: '清除', details: '查看接入说明',
    emptyTitle: '暂时没有匹配的组件', emptyText: '试试缩短关键词，或者清除筛选条件。', viewAll: '查看全部组件', loadMore: '继续查看', more: '个组件',
    trusted: '可信数据', trustedTitle: '每一条信息，都能回到来源。', trustedText: '系统每日发现新增组件，只自动发布来自官方渠道且通过结构校验的内容。无法确认的免费额度和可用性，会明确标记“待确认”。',
    steps: [['发现与去重', '持续跟踪公开目录、官方仓库与产品文档'], ['AI 双语整理', '同步生成中英文介绍、标签、场景和快速接入说明'], ['证据与可用性校验', '保留官网、文档、来源与最后验证日期']],
  };
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesText = !needle || [item.name, en ? item.descriptionEn : item.description, categoryLabel(item.category, locale), ...(en ? item.tagsEn : item.tags)]
        .join(' ').toLowerCase().includes(needle);
      return matchesText && (category === 'all' || item.category === category) && (!verifiedOnly || item.status === '已验证');
    });
  }, [items, query, category, verifiedOnly, en, locale]);

  const selectCategory = (value: string) => {
    setCategory(value);
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main lang={en ? 'en' : 'zh-CN'}>
      <SiteHeader locale={locale} />
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="orbit orbit-one" aria-hidden="true"><span>API</span><span>MCP</span><span>SDK</span></div>
        <div className="eyebrow"><span /> {copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span aria-hidden="true">⌕</span>
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label={copy.search} placeholder={copy.placeholder} />
          <kbd>⌘ K</kbd>
          <button type="submit">{copy.search}</button>
        </form>
      </section>

      <section className="stats" aria-label={en ? 'Site statistics' : '网站数据'}>
        <div><strong>{items.length}</strong><span>{copy.collected}</span></div>
        <div><strong>{categories.length}</strong><span>{copy.categories}</span></div>
        <div><strong>{items.filter((item) => item.status === '已验证').length}</strong><span>{copy.verifiedCount}</span></div>
        <div><strong>{copy.daily}</strong><span>{copy.schedule}</span></div>
      </section>

      <section className="section category-section" id="categories">
        <div className="section-head">
          <div><span className="section-kicker">{copy.explore}</span><h2>{copy.browse}</h2></div>
          <p>{copy.browseNote}</p>
        </div>
        <div className="category-grid">
          {categories.map((name, index) => (
            <button key={name} onClick={() => selectCategory(name)}>
              <span className={`category-symbol symbol-${index % 6}`}>{categoryIcons[name] ?? name.slice(0, 1)}</span>
              <span className="category-copy"><strong>{categoryLabel(name, locale)}</strong><small>{items.filter((item) => item.category === name).length} {copy.components}</small></span>
              <b>→</b>
            </button>
          ))}
        </div>
      </section>

      <section className="section catalog-section" id="catalog">
        <div className="section-head catalog-head">
          <div><span className="section-kicker">{copy.catalog}</span><h2>{category === 'all' ? copy.componentCatalog : categoryLabel(category, locale)}</h2></div>
          <div className="catalog-controls">
            <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>{copy.all}</button>
            <button className={verifiedOnly ? 'active' : ''} onClick={() => setVerifiedOnly(!verifiedOnly)}>✓ {copy.verified}</button>
          </div>
        </div>
        <div className="result-line"><span>{en ? `${filtered.length} ${copy.found}` : `找到 ${filtered.length} ${copy.found}`}</span>{query && <button onClick={() => setQuery('')}>{copy.clear} “{query}” ×</button>}</div>
        {filtered.length ? (
          <div className="tool-grid">
            {filtered.slice(0, visibleCount).map((tool) => (
              <article className="tool-card" key={tool.slug}>
                <div className="tool-top">
                  <ToolLogo {...tool} className="tool-icon" locale={locale} />
                  <div className="tool-title">
                    <h3>{tool.name}</h3>
                    <span className="type">{typeIcons[tool.type] || '◫'} {typeLabel(tool.type, locale)} · {categoryLabel(tool.category, locale)}</span>
                  </div>
                  <span className={tool.status === '已验证' ? 'verified' : 'pending'}>{tool.status === '已验证' ? '✓' : '◷'} {statusLabel(tool.status, locale)}</span>
                </div>
                <p>{en ? tool.descriptionEn : tool.description}</p>
                <div className="card-actions">
                  <div className="tags"><span>{authLabel(tool.auth, locale)}</span><span>{tool.free ? copy.free : copy.paid}</span></div>
                  <a href={`${en ? '/en' : ''}/tool/${tool.slug}`}>{copy.details} <b>→</b></a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span>⌕</span><h3>{copy.emptyTitle}</h3><p>{copy.emptyText}</p><button onClick={() => { setQuery(''); setCategory('all'); setVerifiedOnly(false); }}>{copy.viewAll}</button></div>
        )}
        {visibleCount < filtered.length && <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{copy.loadMore} <b>{Math.min(PAGE_SIZE, filtered.length - visibleCount)}</b> {copy.more}</button>}
      </section>

      <section className="standards" id="standards">
        <div><span className="section-kicker">{copy.trusted}</span><h2>{copy.trustedTitle}</h2><p>{copy.trustedText}</p></div>
        <ol>
          {copy.steps.map(([title, detail], index) => <li key={title}><b>0{index + 1}</b><span><strong>{title}</strong><small>{detail}</small></span></li>)}
        </ol>
      </section>
      <SiteFooter locale={locale} />
    </main>
  );
}
