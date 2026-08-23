import { CopyButton } from '@/components/copy-button';
import { ToolLogo } from '@/components/catalog-explorer';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import type { CatalogItem } from '@/lib/catalog';
import { authLabel, categoryLabel, connectionLabel, statusLabel, typeLabel, type Locale } from '@/lib/i18n';

export function ToolDetailPage({ item, alternatives, locale }: { item: CatalogItem; alternatives: CatalogItem[]; locale: Locale }) {
  const en = locale === 'en';
  const home = en ? '/en' : '';
  const description = en ? item.descriptionEn : item.description;
  const summary = en ? item.summaryEn : item.summary;
  const quickstart = en ? item.quickstartEn : item.quickstart;
  const useCases = en ? item.useCasesEn : item.useCases;
  const tags = en ? item.tagsEn : item.tags;
  const verified = item.status === '已验证';

  return (
    <main lang={en ? 'en' : 'zh-CN'}>
      <SiteHeader locale={locale} alternateHref={`${en ? '' : '/en'}/tool/${item.slug}`} />
      <div className="detail-wrap">
        <div className="breadcrumbs"><a href={home || '/'}>{en ? 'Home' : '首页'}</a><span>›</span><a href={`${home || '/'}#categories`}>{categoryLabel(item.category, locale)}</a><span>›</span><b>{item.name}</b></div>
        <section className="detail-hero">
          <ToolLogo {...item} className="detail-icon" locale={locale} />
          <div className="detail-heading">
            <div className="detail-meta"><span>{typeLabel(item.type, locale)}</span><span>{categoryLabel(item.category, locale)}</span><span className={verified ? 'verified' : 'pending'}>{verified ? '✓' : '◷'} {statusLabel(item.status, locale)}</span></div>
            <h1>{item.name}</h1>
            <p>{description}</p>
          </div>
          <a className="primary-link" href={item.officialUrl} target="_blank" rel="noreferrer">{en ? 'Visit official website ↗' : '访问官方网站 ↗'}</a>
        </section>

        <div className="detail-layout">
          <article className="detail-content">
            <section><span className="section-kicker">{en ? 'OVERVIEW' : '功能概览'}</span><h2>{en ? 'What it does' : '它能做什么'}</h2><p>{summary}</p></section>
            <section><span className="section-kicker">{en ? 'QUICK START' : '快速接入'}</span><h2>{en ? 'Get started' : '开始接入'}</h2><div className="code-block"><div><span>{en ? 'Integration guide' : '接入说明'}</span><CopyButton value={quickstart} locale={locale} /></div><pre><code>{quickstart}</code></pre></div><p className="code-note">{en ? 'Read the official documentation and protect your credentials before using this in production.' : '生产环境请阅读官方文档，并妥善保管密钥。'}</p></section>
            <section><span className="section-kicker">{en ? 'USE CASES' : '使用场景'}</span><h2>{en ? 'Good fits' : '适合这些场景'}</h2><div className="use-case-grid">{useCases.map((useCase, index) => <div key={useCase}><b>0{index + 1}</b><span>{useCase}</span></div>)}</div></section>
            <section><span className="section-kicker">{en ? 'SOURCES' : '资料来源'}</span><h2>{en ? 'Official documentation and sources' : '官方资料与信息来源'}</h2><div className="source-list"><a href={item.docsUrl} target="_blank" rel="noreferrer"><span>{en ? 'Official docs' : '官方文档'}</span><b>{new URL(item.docsUrl).hostname} ↗</b></a><a href={item.sourceUrl} target="_blank" rel="noreferrer"><span>{en ? 'Listing source' : '收录来源'}</span><b>{new URL(item.sourceUrl).hostname} ↗</b></a></div></section>
            {alternatives.length > 0 && <section><span className="section-kicker">{en ? 'ALTERNATIVES' : '同类推荐'}</span><h2>{en ? 'Similar components' : '同类组件'}</h2><div className="alternative-list">{alternatives.map((alt) => <a href={`${home}/tool/${alt.slug}`} key={alt.slug}><ToolLogo {...alt} className="mini-icon" locale={locale} /><span><b>{alt.name}</b><small>{en ? alt.descriptionEn : alt.description}</small></span><em>→</em></a>)}</div></section>}
          </article>
          <aside className="fact-panel">
            <h3>{en ? 'Integration facts' : '接入信息'}</h3>
            <dl><div><dt>{en ? 'Component type' : '组件类型'}</dt><dd>{typeLabel(item.type, locale)}</dd></div><div><dt>{en ? 'Authentication' : '认证方式'}</dt><dd>{authLabel(item.auth, locale)}</dd></div><div><dt>{en ? 'Free access' : '免费使用'}</dt><dd className="yes">{item.free ? (en ? '✓ Free tier' : '✓ 有免费额度') : (en ? 'No' : '否')}</dd></div>{item.https && <div><dt>{en ? 'HTTPS' : '加密连接'}</dt><dd>{connectionLabel(item.https, locale)}</dd></div>}{item.cors && <div><dt>{en ? 'CORS' : '跨域调用'}</dt><dd>{connectionLabel(item.cors, locale)}</dd></div>}<div><dt>{en ? 'Status' : '当前状态'}</dt><dd>{statusLabel(item.status, locale)}</dd></div><div><dt>{verified ? (en ? 'Last verified' : '最后验证') : (en ? 'Last synced' : '信息同步')}</dt><dd>{item.verifiedAt}</dd></div></dl>
            <div className="fact-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <a href={item.docsUrl} target="_blank" rel="noreferrer">{en ? 'Read official docs ↗' : '阅读官方文档 ↗'}</a>
            <p>{en ? 'Free-tier policies can change. Check the official source for current terms.' : '免费政策可能随时变化，请以官方信息为准。'}</p>
          </aside>
        </div>
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
