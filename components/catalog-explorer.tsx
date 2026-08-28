'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogItem } from '@/lib/catalog';
import { localAdvisorPlan, rankAdvisorCandidates, type AdvisorPlan } from '@/lib/advisor';
import { authLabel, categoryLabel, statusLabel, typeLabel, type Locale } from '@/lib/i18n';
import { scenarios } from '@/lib/scenarios';
import { JsonLd, SiteFooter, SiteHeader } from '@/components/site-shell';
import { ToolLogo } from '@/components/tool-logo';

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
const SCENARIO_PAGE_SIZE = 8;
export type ExplorerItem = Pick<CatalogItem, 'slug' | 'name' | 'initial' | 'type' | 'category' | 'description' | 'auth' | 'free' | 'status' | 'verifiedAt' | 'accent' | 'tags' | 'officialUrl' | 'docsUrl'>;
type BilingualExplorerItem = ExplorerItem & Pick<CatalogItem, 'descriptionEn' | 'tagsEn'>;

export function CatalogExplorer({ items, categories, categoryCounts, totalCount, verifiedCount, locale = 'zh' }: { items: BilingualExplorerItem[]; categories: string[]; categoryCounts: Record<string, number>; totalCount: number; verifiedCount: number; locale?: Locale }) {
  const en = locale === 'en';
  const copy = en ? {
    all: 'Featured', verified: 'Verified only', pending: 'Pending review', free: 'Free access reported', paid: 'Paid',
    title: <>Find, understand, and integrate<br /><em>every AI capability</em></>,
    subtitle: 'APIs, MCP services, models, SDKs, and agent tools—all in one place',
    collected: 'components listed', categories: 'capability categories', verifiedCount: 'verified and available', daily: 'Daily updates', schedule: 'Runs automatically at 00:20 UTC',
    explore: 'EXPLORE', browse: 'Browse by capability', browseNote: 'Start with the need, even if you do not know the tool name', components: 'components',
    catalog: 'CATALOG', componentCatalog: 'Featured components', found: 'components found', details: 'View integration guide',
    emptyTitle: 'No matching components yet', emptyText: 'Try a shorter keyword or clear the filters.', viewAll: 'View all components', loadMore: 'Load', more: 'more components',
    useCases: 'START WITH A GOAL', useCasesTitle: 'Turn an idea into a complete solution', useCasesNote: 'Choose a common goal for an architecture, implementation path, and practical stack', useCaseAction: 'View solution', moreScenarios: 'View more use cases',
    assistant: 'AI Advisor', assistantIntro: 'Tell me what you want to build. I’ll turn the directory into a practical tool plan.', assistantPlaceholder: 'What do you want to build?', send: 'Ask AI', close: 'Close AI advisor',
    thinking: 'Building a tool plan…', advisorError: 'The AI assistant is temporarily unavailable. Showing a locally matched plan instead.', recommended: 'Verified recommendations', open: 'Open evidence', evidence: 'Verified source', helpful: 'Was this useful?', yes: 'Yes', no: 'No', directory: 'Search the full directory',
  } : {
    all: '精选', verified: '仅看已验证', pending: '待确认', free: '有免费信息（待核实）', paid: '付费',
    title: <>找到、看懂、接入<br /><em>每一种 AI 能力</em></>,
    subtitle: '开放接口、MCP、模型、开发工具包与智能体工具，一站查清',
    collected: '已收录组件', categories: '能力分类', verifiedCount: '已验证可用', daily: '每日更新', schedule: '新加坡时间 08:20 自动运行',
    explore: '探索', browse: '按能力查找', browseNote: '从需求出发，不必先知道工具名字', components: '个组件',
    catalog: '目录', componentCatalog: '精选组件', found: '个组件', details: '查看接入说明',
    emptyTitle: '暂时没有匹配的组件', emptyText: '试试缩短关键词，或者清除筛选条件。', viewAll: '查看全部组件', loadMore: '继续查看', more: '个组件',
    useCases: '从目标出发', useCasesTitle: '把一个想法变成完整方案', useCasesNote: '选择常见目标，查看参考架构、实施路径与可落地的工具组合', useCaseAction: '查看方案', moreScenarios: '继续查看更多场景',
    assistant: 'AI 助手', assistantIntro: '告诉我你想实现什么，我会从全站组件中整理方案并推荐合适工具。', assistantPlaceholder: '例如：为电商网站搭建智能客服', send: '发送', close: '关闭 AI 助手',
    thinking: '正在整理工具方案…', advisorError: 'AI 助手暂时不可用，已为你展示本地匹配方案。', recommended: '已验证推荐', open: '查看证据', evidence: '已核验来源', helpful: '这个方案有帮助吗？', yes: '有帮助', no: '需改进', directory: '搜索完整目录',
  };
  const [advisorInput, setAdvisorInput] = useState('');
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [advisorPlan, setAdvisorPlan] = useState<AdvisorPlan>();
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [visibleScenarioCount, setVisibleScenarioCount] = useState(SCENARIO_PAGE_SIZE);
  const [feedbackSent, setFeedbackSent] = useState(false);
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

  const filtered = useMemo(() => items.filter((item) => !verifiedOnly || item.status === '已验证'), [items, verifiedOnly]);
  const advisorEndpoint = process.env.NEXT_PUBLIC_ADVISOR_ENDPOINT ?? 'https://ai-baibaoxiang-editor.hans-pan007.workers.dev/advisor';

  const sendEvent = (event: 'advisor_feedback' | 'tool_open', value: string) => {
    const endpoint = new URL('/event', advisorEndpoint).toString();
    navigator.sendBeacon(endpoint, JSON.stringify({ event, value, locale }));
  };

  const askAdvisor = async (need: string) => {
    setAdvisorOpen(true);
    const source = items.filter((item) => item.status === '已验证').map((item) => ({
      slug: item.slug, name: item.name, category: categoryLabel(item.category, locale),
      description: en ? item.descriptionEn : item.description, tags: en ? item.tagsEn : item.tags,
      status: item.status, free: item.free, verifiedAt: item.verifiedAt,
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
      const response = await fetch(advisorEndpoint, {
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
            mainEntity: { '@type': 'ItemList', numberOfItems: totalCount, itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, url: `${origin}${en ? '/en' : ''}/tool/${item.slug}` })) },
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
        <div><strong>{totalCount}</strong><span>{copy.collected}</span></div>
        <div><strong>{categories.length}</strong><span>{copy.categories}</span></div>
        <div><strong>{verifiedCount}</strong><span>{copy.verifiedCount}</span></div>
        <div><strong>{copy.daily}</strong><span>{copy.schedule}</span></div>
      </section>

      <section className="section scenario-section" id="use-cases">
        <div className="section-head">
          <div><span className="section-kicker">{copy.useCases}</span><h2>{copy.useCasesTitle}</h2></div>
          <p>{copy.useCasesNote}</p>
        </div>
        <div className="scenario-grid">
          {scenarios.slice(0, visibleScenarioCount).map((scenario) => (
            <a key={scenario.slug} href={`${en ? '/en' : ''}/solution/${scenario.slug}`}>
              <span className="scenario-icon" aria-hidden="true">{scenario.icon}</span>
              <strong>{scenario.title[locale]}</strong>
              <small>{scenario.summary[locale]}</small>
              <b>{copy.useCaseAction} →</b>
            </a>
          ))}
        </div>
        {visibleScenarioCount < scenarios.length && <button className="load-more" onClick={() => setVisibleScenarioCount(scenarios.length)}>{copy.moreScenarios} <b>{scenarios.length - visibleScenarioCount}</b></button>}
      </section>

      <section className="section category-section" id="categories">
        <div className="section-head">
          <div><span className="section-kicker">{copy.explore}</span><h2>{copy.browse}</h2></div>
          <p>{copy.browseNote}</p>
        </div>
        <div className="category-grid">
          {categories.map((name, index) => (
            <a key={name} href={`${en ? '/en' : ''}/catalog?category=${encodeURIComponent(name)}`}>
              <span className={`category-symbol symbol-${index % 6}`}>{categoryIcons[name] ?? name.slice(0, 1)}</span>
              <span className="category-copy"><strong>{categoryLabel(name, locale)}</strong><small>{categoryCounts[name]} {copy.components}</small></span>
              <b>→</b>
            </a>
          ))}
        </div>
      </section>

      <section className="section catalog-section" id="catalog">
        <div className="section-head catalog-head">
          <div><span className="section-kicker">{copy.catalog}</span><h2>{copy.componentCatalog}</h2></div>
          <div className="catalog-controls">
            <button className={!verifiedOnly ? 'active' : ''} onClick={() => setVerifiedOnly(false)}>{copy.all}</button>
            <button className={verifiedOnly ? 'active' : ''} onClick={() => setVerifiedOnly(!verifiedOnly)}>✓ {copy.verified}</button>
          </div>
        </div>
        <div className="result-line"><span>{en ? `${verifiedOnly ? verifiedCount : totalCount} ${copy.found}` : `找到 ${verifiedOnly ? verifiedCount : totalCount} ${copy.found}`}</span></div>
        {filtered.length ? (
          <div className="tool-grid">
            {filtered.map((tool) => (
              <article className="tool-card" key={tool.slug}>
                <div className="tool-top">
                  <ToolLogo {...tool} className="tool-icon" />
                  <div className="tool-title">
                    <h3>{tool.name}</h3>
                    <span className="type">{typeIcons[tool.type] || '◫'} {typeLabel(tool.type, locale)} · {categoryLabel(tool.category, locale)}</span>
                  </div>
                  <span className={tool.status === '已验证' ? 'verified' : 'pending'}>{tool.status === '已验证' ? '✓' : '◷'} {statusLabel(tool.status, locale)}</span>
                </div>
                <p>{en ? tool.descriptionEn : tool.description}</p>
                <div className="card-actions">
                  <div className="tags"><span>{authLabel(tool.auth, locale)}</span><span>{tool.free ? copy.free : copy.paid}</span></div>
                  <a href={`${en ? '/en' : ''}/tool/${tool.slug}`} onClick={() => sendEvent('tool_open', tool.slug)}>{copy.details} <b>→</b></a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><span>⌕</span><h3>{copy.emptyTitle}</h3><p>{copy.emptyText}</p><button onClick={() => setVerifiedOnly(false)}>{copy.viewAll}</button></div>
        )}
        <a className="load-more" href={`${en ? '/en' : ''}/catalog`}>{copy.directory} →</a>
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
                      return <a key={recommendation.slug} href={`${en ? '/en' : ''}/tool/${recommendation.slug}`} onClick={() => sendEvent('tool_open', recommendation.slug)}><b>{tool.name}</b><span>{recommendation.role} · {recommendation.reason}</span><small>✓ {copy.evidence} · {tool.verifiedAt}</small><em>{copy.open} →</em></a>;
                    })}
                  </div>
                  {advisorPlan.followUp && <p className="advisor-follow-up">{advisorPlan.followUp}</p>}
                  {!feedbackSent && <div className="advisor-feedback"><span>{copy.helpful}</span><button onClick={() => { sendEvent('advisor_feedback', 'yes'); setFeedbackSent(true); }}>↑ {copy.yes}</button><button onClick={() => { sendEvent('advisor_feedback', 'no'); setFeedbackSent(true); }}>↓ {copy.no}</button></div>}
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
