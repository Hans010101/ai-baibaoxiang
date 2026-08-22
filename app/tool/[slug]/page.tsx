import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CopyButton } from '@/components/copy-button';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { catalog, getCatalogItem } from '@/lib/catalog';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item) return { title: '组件未找到 - AI 百宝箱' };
  return {
    title: `${item.name}：功能、免费额度与接入说明 - AI 百宝箱`,
    description: item.description,
    openGraph: { title: `${item.name} - AI 百宝箱`, description: item.description, images: [] },
    twitter: { card: 'summary', title: `${item.name} - AI 百宝箱`, description: item.description, images: [] },
  };
}

export default async function ToolDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item) notFound();
  const alternatives = catalog.filter((candidate) => candidate.category === item.category && candidate.slug !== item.slug).slice(0, 3);

  return (
    <main>
      <SiteHeader />
      <div className="detail-wrap">
        <div className="breadcrumbs"><Link href="/">首页</Link><span>›</span><Link href="/#categories">{item.category}</Link><span>›</span><b>{item.name}</b></div>
        <section className="detail-hero">
          <span className="detail-icon" style={{ background: item.accent }}>{item.initial}</span>
          <div className="detail-heading">
            <div className="detail-meta"><span>{item.type}</span><span>{item.category}</span><span className={item.status === '已验证' ? 'verified' : 'pending'}>{item.status === '已验证' ? '✓' : '◷'} {item.status}</span></div>
            <h1>{item.name}</h1>
            <p>{item.description}</p>
          </div>
          <a className="primary-link" href={item.officialUrl} target="_blank" rel="noreferrer">访问官方网站 ↗</a>
        </section>

        <div className="detail-layout">
          <article className="detail-content">
            <section><span className="section-kicker">OVERVIEW</span><h2>它能做什么</h2><p>{item.summary}</p></section>
            <section><span className="section-kicker">QUICK START</span><h2>开始接入</h2><div className="code-block"><div><span>接入说明</span><CopyButton value={item.quickstart} /></div><pre><code>{item.quickstart}</code></pre></div><p className="code-note">生产环境请阅读官方文档，并妥善保管密钥。</p></section>
            <section><span className="section-kicker">USE CASES</span><h2>适合这些场景</h2><div className="use-case-grid">{item.useCases.map((useCase, index) => <div key={useCase}><b>0{index + 1}</b><span>{useCase}</span></div>)}</div></section>
            <section><span className="section-kicker">EVIDENCE</span><h2>官方资料与信息来源</h2><div className="source-list"><a href={item.docsUrl} target="_blank" rel="noreferrer"><span>官方文档</span><b>{new URL(item.docsUrl).hostname} ↗</b></a><a href={item.sourceUrl} target="_blank" rel="noreferrer"><span>收录来源</span><b>{new URL(item.sourceUrl).hostname} ↗</b></a></div></section>
            {alternatives.length > 0 && <section><span className="section-kicker">ALTERNATIVES</span><h2>同类组件</h2><div className="alternative-list">{alternatives.map((alt) => <Link href={`/tool/${alt.slug}`} key={alt.slug}><span className="mini-icon" style={{ background: alt.accent }}>{alt.initial}</span><span><b>{alt.name}</b><small>{alt.description}</small></span><em>→</em></Link>)}</div></section>}
          </article>
          <aside className="fact-panel">
            <h3>接入信息</h3>
            <dl><div><dt>组件类型</dt><dd>{item.type}</dd></div><div><dt>认证方式</dt><dd>{item.auth}</dd></div><div><dt>免费使用</dt><dd className="yes">{item.free ? '✓ 有免费额度' : '否'}</dd></div>{item.https && <div><dt>HTTPS</dt><dd>{item.https}</dd></div>}{item.cors && <div><dt>CORS</dt><dd>{item.cors}</dd></div>}<div><dt>当前状态</dt><dd>{item.status}</dd></div><div><dt>{item.status === '已验证' ? '最后验证' : '信息同步'}</dt><dd>{item.verifiedAt}</dd></div></dl>
            <div className="fact-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <a href={item.docsUrl} target="_blank" rel="noreferrer">阅读官方文档 ↗</a>
            <p>免费政策可能随时变化，请以官方信息为准。</p>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
