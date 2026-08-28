import { JsonLd, SiteFooter, SiteHeader } from '@/components/site-shell';
import type { Locale } from '@/lib/i18n';

export function MethodologyPage({ locale }: { locale: Locale }) {
  const en = locale === 'en';
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const path = en ? '/en/methodology' : '/methodology';
  const sections = en ? [
    ['What “verified” means', 'A verified record has been checked against its official website or documentation. Pending records remain searchable but are excluded from the sitemap and are never presented by the AI advisor as verified recommendations.'],
    ['Free-access claims', 'Free plans and quotas can change. We only label free access as verified when current first-party evidence is available; otherwise the policy is explicitly marked pending review.'],
    ['AI advisor and privacy', 'The advisor sends your question and a small list of verified candidates to Cloudflare Workers AI. DeepSeek is used only if the Cloudflare request fails and a server-side key has been configured. Do not enter passwords, API keys, personal data, or confidential information.'],
    ['Measurement and corrections', 'We record anonymous operational events such as advisor success, feedback, and opened tool slugs in Cloudflare logs. We do not require an account or intentionally store question text in analytics. Report outdated records through the public correction link.'],
  ] : [
    ['“已验证”的含义', '已验证记录代表我们依据官方网站或官方文档完成过核对。待确认记录仍可被搜索，但不会进入站点地图，也不会被 AI 助手当作已验证工具推荐。'],
    ['免费信息口径', '免费方案和额度可能变化。只有存在当前一手证据时才标记为已核验；其余记录会明确显示“政策待核实”，不再把历史收录值当作确定事实。'],
    ['AI 助手与隐私', '助手会把你的问题和少量已验证候选工具发送给 Cloudflare Workers AI。只有 Cloudflare 请求失败且服务端已配置密钥时才会使用 DeepSeek。请勿输入密码、API 密钥、个人信息或机密内容。'],
    ['数据衡量与纠错', '我们仅在 Cloudflare 日志中记录助手是否成功、反馈结果和被打开的工具标识等匿名运营事件；无需注册账号，也不会主动把问题正文写入分析事件。发现过期信息可通过公开纠错入口反馈。'],
  ];
  return <main lang={en ? 'en' : 'zh-CN'}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: en ? 'Data methodology and privacy' : '数据方法与隐私说明', url: `${origin}${path}`, inLanguage: en ? 'en' : 'zh-CN' }} />
    <SiteHeader locale={locale} />
    <article className="policy-wrap"><span className="section-kicker">{en ? 'TRUST & PRIVACY' : '可信与隐私'}</span><h1>{en ? 'How AI Toolbox handles data' : 'AI 百宝箱如何处理数据'}</h1><p className="policy-lead">{en ? 'Clear evidence boundaries are part of the product, not fine print.' : '证据边界是产品能力的一部分，而不是藏在角落里的免责说明。'}</p>{sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}<p className="policy-date">{en ? 'Last updated: August 28, 2026' : '最后更新：2026 年 8 月 28 日'}</p></article>
    <SiteFooter locale={locale} />
  </main>;
}
