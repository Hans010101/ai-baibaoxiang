import Link from 'next/link';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AI 百宝箱首页">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>AI 百宝箱</span>
    </Link>
  );
}

export function SiteHeader() {
  const repositoryUrl = process.env.NEXT_PUBLIC_REPOSITORY_URL;
  const submitUrl = repositoryUrl
    ? `${repositoryUrl}/issues/new?template=submit-component.yml`
    : 'https://github.com/public-apis/public-apis/blob/master/CONTRIBUTING.md';

  return (
    <header className="site-header">
      <Brand />
      <nav aria-label="主导航">
        <Link href="/#categories">能力分类</Link>
        <Link href="/#catalog">全部组件</Link>
        <Link href="/#standards">收录标准</Link>
      </nav>
      <a className="submit-link" href={submitUrl} target="_blank" rel="noreferrer">提交组件 ↗</a>
    </header>
  );
}

export function SiteFooter() {
  const repositoryUrl = process.env.NEXT_PUBLIC_REPOSITORY_URL ?? 'https://github.com/public-apis/public-apis';

  return (
    <footer className="site-footer">
      <div>
        <Brand />
        <p>找到、看懂、接入每一种 AI 能力。</p>
      </div>
      <div className="footer-note">
        <span>数据每日自动更新</span>
        <a href={repositoryUrl} target="_blank" rel="noreferrer">数据源与贡献 ↗</a>
      </div>
    </footer>
  );
}
