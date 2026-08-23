import type { Locale } from '@/lib/i18n';

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

export function Brand({ locale = 'zh' }: { locale?: Locale }) {
  return (
    <a className="brand" href={locale === 'en' ? '/en' : '/'} aria-label={locale === 'en' ? 'AI Toolbox home' : 'AI 百宝箱首页'}>
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>{locale === 'en' ? 'AI Toolbox' : 'AI 百宝箱'}</span>
    </a>
  );
}

export function SiteHeader({ locale = 'zh', alternateHref }: { locale?: Locale; alternateHref?: string }) {
  const home = locale === 'en' ? '/en' : '/';

  return (
    <header className="site-header">
      <Brand locale={locale} />
      <nav aria-label={locale === 'en' ? 'Main navigation' : '主导航'}>
        <a href={`${home}#categories`}>{locale === 'en' ? 'Categories' : '能力分类'}</a>
        <a href={`${home}#catalog`}>{locale === 'en' ? 'All tools' : '全部组件'}</a>
        <a href={`${home}#use-cases`}>{locale === 'en' ? 'Use cases' : '常见场景'}</a>
      </nav>
      <div className="header-actions">
        <a className="language-link" href={alternateHref ?? (locale === 'en' ? '/' : '/en')} aria-label={locale === 'en' ? '切换到中文' : 'Switch to English'}><span className={locale === 'zh' ? 'active' : ''}>中文</span><i>/</i><span className={locale === 'en' ? 'active' : ''}>EN</span></a>
      </div>
    </header>
  );
}

export function SiteFooter({ locale = 'zh' }: { locale?: Locale }) {
  return (
    <footer className="site-footer">
      <Brand locale={locale} />
      <p>{locale === 'en' ? 'Find, understand, and integrate every AI capability.' : '找到、看懂、接入每一种 AI 能力。'}</p>
    </footer>
  );
}
