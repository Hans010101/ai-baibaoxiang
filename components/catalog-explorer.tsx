'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { CatalogItem } from '@/lib/catalog';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

const typeIcons: Record<string, string> = { API: '⌁', MCP: '⋈', 模型: '◈', SDK: '{ }' };
const PAGE_SIZE = 48;
export type ExplorerItem = Pick<CatalogItem, 'slug' | 'name' | 'initial' | 'type' | 'category' | 'description' | 'auth' | 'free' | 'status' | 'accent' | 'tags'>;

export function CatalogExplorer({ items, categories }: { items: ExplorerItem[]; categories: string[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
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
      const matchesText = !needle || [item.name, item.description, item.category, ...item.tags]
        .join(' ').toLowerCase().includes(needle);
      return matchesText && (category === '全部' || item.category === category) && (!verifiedOnly || item.status === '已验证') && (!freeOnly || item.free);
    });
  }, [items, query, category, verifiedOnly, freeOnly]);

  const selectCategory = (value: string) => {
    setCategory(value);
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="orbit orbit-one" aria-hidden="true"><span>API</span><span>MCP</span><span>SDK</span></div>
        <div className="eyebrow"><span /> 持续更新的 AI 组件黄页</div>
        <h1>找到、看懂、接入<br /><em>每一种 AI 能力。</em></h1>
        <p>API、MCP、模型、SDK 与 Agent 工具，一站查清。</p>
        <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <span aria-hidden="true">⌕</span>
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索组件" placeholder="你想给产品接入什么能力？" />
          <kbd>⌘ K</kbd>
          <button type="submit">搜索</button>
        </form>
        <div className="quick-filters" aria-label="快捷筛选">
          <span>热门：</span>
          <button onClick={() => setQuery('无需密钥')}>无需密钥</button>
          <button onClick={() => setFreeOnly(!freeOnly)} className={freeOnly ? 'active' : ''}>有免费额度</button>
          <button onClick={() => { setQuery(''); setCategory('MCP 服务'); }}>MCP</button>
          <button onClick={() => setVerifiedOnly(!verifiedOnly)} className={verifiedOnly ? 'active' : ''}>已验证</button>
        </div>
      </section>

      <section className="stats" aria-label="网站数据">
        <div><strong>{items.length}</strong><span>已收录组件</span></div>
        <div><strong>{categories.length}</strong><span>能力分类</span></div>
        <div><strong>{items.filter((item) => item.status === '已验证').length}</strong><span>已验证可用</span></div>
        <div><strong>每日更新</strong><span>UTC 00:20 自动运行</span></div>
      </section>

      <section className="section category-section" id="categories">
        <div className="section-head">
          <div><span className="section-kicker">EXPLORE</span><h2>按能力查找</h2></div>
          <p>从需求出发，不必先知道工具名字</p>
        </div>
        <div className="category-grid">
          {categories.map((name, index) => (
            <button key={name} onClick={() => selectCategory(name)}>
              <span className={`category-symbol symbol-${index % 4}`}>{['⌁', '◫', '✦', '⋈'][index % 4]}</span>
              <strong>{name}</strong>
              <small>{items.filter((item) => item.category === name).length} 个组件</small>
              <b>→</b>
            </button>
          ))}
        </div>
      </section>

      <section className="section catalog-section" id="catalog">
        <div className="section-head catalog-head">
          <div><span className="section-kicker">CATALOG</span><h2>{category === '全部' ? '组件目录' : category}</h2></div>
          <div className="catalog-controls">
            <button className={category === '全部' ? 'active' : ''} onClick={() => setCategory('全部')}>全部</button>
            <button className={verifiedOnly ? 'active' : ''} onClick={() => setVerifiedOnly(!verifiedOnly)}>✓ 已验证</button>
          </div>
        </div>
        <div className="result-line"><span>找到 {filtered.length} 个组件</span>{query && <button onClick={() => setQuery('')}>清除“{query}” ×</button>}</div>
        {filtered.length ? (
          <div className="tool-grid">
            {filtered.slice(0, visibleCount).map((tool) => (
              <article className="tool-card" key={tool.slug}>
                <div className="tool-top">
                  <span className="tool-icon" style={{ background: tool.accent }}>{tool.initial}</span>
                  <span className={tool.status === '已验证' ? 'verified' : 'pending'}>{tool.status === '已验证' ? '✓' : '◷'} {tool.status}</span>
                </div>
                <span className="type">{typeIcons[tool.type] || '◫'} {tool.type} · {tool.category}</span>
                <h3>{tool.name}</h3>
                <p>{tool.description}</p>
                <div className="tags"><span>{tool.auth}</span><span>{tool.free ? '有免费额度' : '付费'}</span></div>
                <Link href={`/tool/${tool.slug}`}>查看接入说明 <b>→</b></Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span>⌕</span><h3>暂时没有匹配的组件</h3><p>试试缩短关键词，或者清除筛选条件。</p><button onClick={() => { setQuery(''); setCategory('全部'); setVerifiedOnly(false); setFreeOnly(false); }}>查看全部组件</button></div>
        )}
        {visibleCount < filtered.length && <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>继续查看 <b>{Math.min(PAGE_SIZE, filtered.length - visibleCount)}</b> 个组件</button>}
      </section>

      <section className="standards" id="standards">
        <div><span className="section-kicker">TRUSTED DATA</span><h2>每一条信息，都能回到来源。</h2><p>系统每日发现新增组件，只自动发布来自官方渠道且通过结构校验的内容。无法确认的免费额度和可用性，会明确标记“待确认”。</p></div>
        <ol>
          <li><b>01</b><span><strong>发现与去重</strong><small>持续跟踪公开目录、官方仓库与产品文档</small></span></li>
          <li><b>02</b><span><strong>AI 结构化整理</strong><small>生成中文介绍、标签、场景和快速接入说明</small></span></li>
          <li><b>03</b><span><strong>证据与可用性校验</strong><small>保留官网、文档、来源与最后验证日期</small></span></li>
        </ol>
      </section>
      <SiteFooter />
    </main>
  );
}
