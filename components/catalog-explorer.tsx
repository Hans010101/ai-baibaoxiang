/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '@/lib/catalog';
import { localAdvisorPlan, rankAdvisorCandidates, type AdvisorPlan } from '@/lib/advisor';
import { authLabel, categoryLabel, statusLabel, typeLabel, type Locale } from '@/lib/i18n';
import { JsonLd, SiteFooter, SiteHeader } from '@/components/site-shell';

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
    title: <>Find, understand, and integrate<br /><em>every AI capability</em></>,
    subtitle: 'APIs, MCP services, models, SDKs, and agent tools—all in one place',
    collected: 'components listed', categories: 'capability categories', verifiedCount: 'verified and available', daily: 'Daily updates', schedule: 'Runs automatically at 00:20 UTC',
    explore: 'EXPLORE', browse: 'Browse by capability', browseNote: 'Start with the need, even if you do not know the tool name', components: 'components',
    catalog: 'CATALOG', componentCatalog: 'Component catalog', found: 'components found', details: 'View integration guide',
    emptyTitle: 'No matching components yet', emptyText: 'Try a shorter keyword or clear the filters.', viewAll: 'View all components', loadMore: 'Load', more: 'more components',
    useCases: 'START WITH A GOAL', useCasesTitle: 'Turn an idea into a tool plan', useCasesNote: 'Choose a common goal and let AI recommend a practical stack', useCaseAction: 'Build my plan',
    assistant: 'AI Advisor', assistantIntro: 'Tell me what you want to build. I’ll turn the directory into a practical tool plan.', assistantPlaceholder: 'What do you want to build?', send: 'Ask AI', close: 'Close AI advisor',
    thinking: 'Building a tool plan…', advisorError: 'The AI assistant is temporarily unavailable. Showing a locally matched plan instead.', recommended: 'Recommended tools', open: 'Open guide',
    scenarios: [
      ['◎', 'Build an AI customer service agent', 'Knowledge base, model, orchestration, and support tools', 'Help me build an AI customer service agent for an ecommerce website'],
      ['⌕', 'Automate research and intelligence', 'Search, extraction, analysis, and reporting tools', 'Help me automate market research, source checking, analysis, and report generation'],
      ['⌁', 'Connect business data to AI', 'Databases, APIs, security, and agent integration', 'Help me connect internal business data to an AI assistant securely'],
      ['✦', 'Launch a content workflow', 'Writing, images, video, publishing, and automation', 'Help me build an AI content creation and publishing workflow'],
    ],
  } : {
    all: '全部', verified: '已验证', pending: '待确认', free: '有免费额度', paid: '付费',
    title: <>找到、看懂、接入<br /><em>每一种 AI 能力</em></>,
    subtitle: '开放接口、MCP、模型、开发工具包与智能体工具，一站查清',
    collected: '已收录组件', categories: '能力分类', verifiedCount: '已验证可用', daily: '每日更新', schedule: '新加坡时间 08:20 自动运行',
    explore: '探索', browse: '按能力查找', browseNote: '从需求出发，不必先知道工具名字', components: '个组件',
    catalog: '目录', componentCatalog: '组件目录', found: '个组件', details: '查看接入说明',
    emptyTitle: '暂时没有匹配的组件', emptyText: '试试缩短关键词，或者清除筛选条件。', viewAll: '查看全部组件', loadMore: '继续查看', more: '个组件',
    useCases: '从目标出发', useCasesTitle: '把一个想法变成工具方案', useCasesNote: '选择常见目标，让 AI 推荐可落地的工具组合', useCaseAction: '生成方案',
    assistant: 'AI 助手', assistantIntro: '告诉我你想实现什么，我会从全站组件中整理方案并推荐合适工具。', assistantPlaceholder: '例如：为电商网站搭建智能客服', send: '发送', close: '关闭 AI 助手',
    thinking: '正在整理工具方案…', advisorError: 'AI 助手暂时不可用，已为你展示本地匹配方案。', recommended: '推荐工具', open: '查看接入说明',
    scenarios: [
      ['◎', '搭建 AI 智能客服', '知识库、模型、编排与客服工具', '帮我为电商网站搭建一套 AI 智能客服方案'],
      ['⌕', '自动化调研与情报', '搜索、采集、分析与报告工具', '帮我实现市场调研、来源核验、分析和报告生成的自动化'],
      ['⌁', '让 AI 连接业务数据', '数据库、接口、安全与智能体接入', '帮我安全地把企业内部业务数据接入 AI 助手'],
      ['✦', '构建内容生产工作流', '文案、图片、视频、发布与自动化', '帮我搭建一套 AI 内容创作和自动发布工作流'],
    ],
  };
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorPlan, setAdvisorPlan] = useState<AdvisorPlan>();
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(false);
  const [category, setCategory] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const advisorRef = useRef<HTMLTextAreaElement>(null);
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const pageUrl = `${origin}${en ? '/en' : '/'}`;

  useEffect(() => {
    if (!advisorOpen) return;
    advisorRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAdvisorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advisorOpen]);

  const filtered = useMemo(() => {
    return items.filter((item) => (category === 'all' || item.category === category) && (!verifiedOnly || item.status === '已验证'));
  }, [items, category, verifiedOnly]);

  const selectCategory = (value: string) => {
    setCategory(value);
    document.querySelector('#catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const askAdvisor = async (need: string) => {
    setAdvisorOpen(true);
    const source = items.map((item) => ({
      slug: item.slug, name: item.name, category: categoryLabel(item.category, locale),
      description: en ? item.descriptionEn : item.description, tags: en ? item.tagsEn : item.tags,
      status: item.status, free: item.free,
    }));
    const ranked = rankAdvisorCandidates(need, source);
    const candidates = ranked.length ? ranked : source.filter((item) => item.status === '已验证').slice(0, 12);
    const fallback = localAdvisorPlan(need, candidates, locale);
    setAdvisorLoading(true);
    setAdvisorError(false);
    setAdvisorPlan(undefined);
    try {
      let session = localStorage.getItem('aibox-advisor-session');
      if (!session) {
        session = crypto.randomUUID();
        localStorage.setItem('aibox-advisor-session', session);
      }
      const response = await fetch(process.env.NEXT_PUBLIC_ADVISOR_ENDPOINT ?? 'https://ai-baibaoxiang-editor.hans-pan007.workers.dev/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Aibox-Session': session },
        body: JSON.stringify({ query: need, locale, candidates }),
      });
      if (!response.ok) throw new Error(`Advisor returned ${response.status}`);
      setAdvisorPlan(await response.json() as AdvisorPlan);
    } catch {
      setAdvisorError(true);
      setAdvisorPlan(fallback);
    } finally {
      setAdvisorLoading(false);
    }
  };

  return (
    <main lang={en ? 'en' : 'zh-CN'}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': `${origin}/#organization`, name: 'AI 百宝箱 / AI Toolbox', url: `${origin}/`, logo: `${origin}/favicon.png` },
          { '@type': 'WebSite', '@id': `${origin}/#website`, name: 'AI 百宝箱 / AI Toolbox', url: `${origin}/`, inLanguage: ['zh-CN', 'en'], publisher: { '@id': `${origin}/#organization` } },
          {
            '@type': 'CollectionPage', '@id': `${pageUrl}#directory`, url: pageUrl,
            name: en ? 'AI Toolbox directory' : 'AI 百宝箱组件目录', inLanguage: en ? 'en' : 'zh-CN', isPartOf: { '@id': `${origin}/#website` },
            mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.slice(0, PAGE_SIZE).map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: `${origin}${en ? '/en' : ''}/tool/${item.slug}` })) },
          },
        ],
      }} />
      <SiteHeader locale={locale} />
      <section className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="orbit orbit-one" aria-hidden="true"><span>API</span><span>MCP</span><span>SDK</span></div>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </section>

      <section className="stats" aria-label={en ? 'Site statistics' : '网站数据'}>
        <div><strong>{items.length}</strong><span>{copy.collected}</span></div>
        <div><strong>{categories.length}</strong><span>{copy.categories}</span></div>
        <div><strong>{items.filter((item) => item.status === '已验证').length}</strong><span>{copy.verifiedCount}</span></div>
        <div><strong>{copy.daily}</strong><span>{copy.schedule}</span></div>
      </section>

      <section className="section scenario-section" id="use-cases">
        <div className="section-head">
          <div><span className="section-kicker">{copy.useCases}</span><h2>{copy.useCasesTitle}</h2></div>
          <p>{copy.useCasesNote}</p>
        </div>
        <div className="scenario-grid">
          {copy.scenarios.map(([icon, title, detail, prompt]) => (
            <button key={title} type="button" onClick={() => { setAdvisorInput(prompt); void askAdvisor(prompt); }}>
              <span className="scenario-icon" aria-hidden="true">{icon}</span>
              <strong>{title}</strong>
              <small>{detail}</small>
              <b>{copy.useCaseAction} →</b>
            </button>
          ))}
        </div>
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
        <div className="result-line"><span>{en ? `${filtered.length} ${copy.found}` : `找到 ${filtered.length} ${copy.found}`}</span></div>
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
          <div className="empty-state"><span>⌕</span><h3>{copy.emptyTitle}</h3><p>{copy.emptyText}</p><button onClick={() => { setCategory('all'); setVerifiedOnly(false); }}>{copy.viewAll}</button></div>
        )}
        {visibleCount < filtered.length && <button className="load-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{copy.loadMore} <b>{Math.min(PAGE_SIZE, filtered.length - visibleCount)}</b> {copy.more}</button>}
      </section>

      <SiteFooter locale={locale} />
      <div className="assistant-dock">
        {advisorOpen && (
          <aside className="assistant-panel" id="ai-advisor-panel" aria-label={copy.assistant}>
            <header>
              <span className="assistant-mini-bot" aria-hidden="true"><i /><i /></span>
              <div><strong>{copy.assistant}</strong><small>ONLINE</small></div>
              <button type="button" onClick={() => setAdvisorOpen(false)} aria-label={copy.close}>×</button>
            </header>
            <div className="assistant-body" aria-live="polite">
              {!advisorPlan && !advisorLoading && <p className="assistant-intro">{copy.assistantIntro}</p>}
              {advisorLoading && <div className="advisor-loading"><i /> {copy.thinking}</div>}
              {advisorPlan && (
                <section className="advisor-card">
                  <div className="advisor-heading"><span>AI</span><p>{advisorPlan.summary}</p></div>
                  {advisorError && <small className="advisor-error">{copy.advisorError}</small>}
                  <ol>{advisorPlan.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  {!!advisorPlan.recommendations.length && <strong className="advisor-label">{copy.recommended}</strong>}
                  <div className="advisor-tools">
                    {advisorPlan.recommendations.map((recommendation) => {
                      const tool = items.find((item) => item.slug === recommendation.slug);
                      if (!tool) return null;
                      return <a key={recommendation.slug} href={`${en ? '/en' : ''}/tool/${recommendation.slug}`}><b>{tool.name}</b><span>{recommendation.role} · {recommendation.reason}</span><em>{copy.open} →</em></a>;
                    })}
                  </div>
                  {advisorPlan.followUp && <p className="advisor-follow-up">{advisorPlan.followUp}</p>}
                </section>
              )}
            </div>
            <form className="assistant-form" onSubmit={(event) => { event.preventDefault(); const need = advisorInput.trim(); if (need) void askAdvisor(need); }}>
              <textarea ref={advisorRef} rows={2} value={advisorInput} onChange={(event) => setAdvisorInput(event.target.value)} placeholder={copy.assistantPlaceholder} aria-label={copy.assistantPlaceholder} />
              <button type="submit" disabled={advisorLoading || !advisorInput.trim()}>{advisorLoading ? '…' : copy.send}</button>
            </form>
          </aside>
        )}
        <button className="robot-launcher" type="button" aria-expanded={advisorOpen} aria-controls="ai-advisor-panel" aria-label={advisorOpen ? copy.close : copy.assistant} onClick={() => setAdvisorOpen((open) => !open)}>
          <span className="robot-antenna" aria-hidden="true" />
          <span className="robot-face" aria-hidden="true"><i /><i /><b /></span>
        </button>
      </div>
    </main>
  );
}
