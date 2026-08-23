import { CopyButton } from '@/components/copy-button';
import { ToolLogo } from '@/components/catalog-explorer';
import { JsonLd, SiteFooter, SiteHeader } from '@/components/site-shell';
import type { CatalogItem } from '@/lib/catalog';
import { categoryLabel, type Locale } from '@/lib/i18n';
import type { Scenario } from '@/lib/scenarios';

export function SolutionDetailPage({ scenario, catalog, locale }: { scenario: Scenario; catalog: CatalogItem[]; locale: Locale }) {
  const en = locale === 'en';
  const home = en ? '/en' : '';
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top';
  const pageUrl = `${origin}${home}/solution/${scenario.slug}`;
  const tools = scenario.categories.flatMap((category) =>
    catalog.filter((item) => item.category === category).sort((a, b) => Number(b.status === '已验证') - Number(a.status === '已验证')).slice(0, 2),
  ).filter((item, index, list) => list.findIndex((candidate) => candidate.slug === item.slug) === index).slice(0, 8);
  const implementation = en ? [
    'Define the user journey, input and output schemas, permission boundaries, and success metrics.',
    'Build one end-to-end happy path with the smallest viable tool stack and a fixed evaluation set.',
    'Add authentication, timeouts, retries, fallbacks, audit logs, and human review for risky actions.',
    'Release to a limited audience, measure quality, latency, and cost, then expand with evidence.',
  ] : [
    '明确用户旅程、输入输出结构、权限边界与成功指标。',
    '用最小工具组合打通一条端到端主链路，并准备固定评测集。',
    '补齐认证、超时、重试、降级、审计日志与高风险人工复核。',
    '先向小范围用户发布，衡量质量、时延和成本，再根据证据扩展。',
  ];
  const checks = en ? [
    'Every stage has a defined owner, input, output, timeout, and failure state.',
    'Credentials and sensitive data stay server-side with least-privilege access.',
    'Model output is validated before it reaches a database, user, or external action.',
    'Sources, tool calls, prompts, versions, and human decisions are traceable.',
    'A fixed evaluation set covers normal, ambiguous, adversarial, and unavailable-tool cases.',
    'The workflow has a visible fallback and a manual recovery path.',
  ] : [
    '每个环节都定义负责人、输入、输出、超时和失败状态。',
    '密钥与敏感数据只留在服务端，并采用最小权限访问。',
    '模型输出写入数据库、展示给用户或触发外部动作前必须校验。',
    '资料来源、工具调用、提示词、版本与人工决定均可追踪。',
    '固定评测集覆盖正常、模糊、对抗和工具不可用等情况。',
    '工作流具备用户可见的降级提示与人工恢复路径。',
  ];
  const code = `type WorkflowInput = { request: string; userId: string };

const stages = ${JSON.stringify(scenario.flow.map((step) => step[locale]), null, 2)};
const selectedTools = ${JSON.stringify(tools.map((tool) => tool.name), null, 2)};

export async function runWorkflow(input: WorkflowInput) {
  let context: unknown = { ...input, selectedTools };

  for (const stage of stages) {
    const response = await fetch('/api/workflow/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, context }),
    });
    if (!response.ok) throw new Error(\`Stage failed: \${stage}\`);
    context = await response.json();
  }

  return context;
}`;

  return (
    <main lang={en ? 'en' : 'zh-CN'}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'TechArticle', '@id': `${pageUrl}#article`, url: pageUrl, headline: scenario.title[locale], description: scenario.summary[locale], inLanguage: en ? 'en' : 'zh-CN', audience: scenario.audience[locale], isPartOf: { '@id': `${origin}/#website` } },
          { '@type': 'HowTo', '@id': `${pageUrl}#howto`, name: scenario.title[locale], description: scenario.summary[locale], inLanguage: en ? 'en' : 'zh-CN', step: scenario.flow.map((step, index) => ({ '@type': 'HowToStep', position: index + 1, name: step[locale], text: step[locale] })) },
          { '@type': 'BreadcrumbList', '@id': `${pageUrl}#breadcrumb`, itemListElement: [
            { '@type': 'ListItem', position: 1, name: en ? 'Home' : '首页', item: `${origin}${home || '/'}` },
            { '@type': 'ListItem', position: 2, name: en ? 'Use cases' : '常见场景', item: `${origin}${home || '/'}#use-cases` },
            { '@type': 'ListItem', position: 3, name: scenario.title[locale], item: pageUrl },
          ] },
        ],
      }} />
      <SiteHeader locale={locale} alternateHref={`${en ? '' : '/en'}/solution/${scenario.slug}`} />
      <div className="detail-wrap solution-wrap">
        <div className="breadcrumbs"><a href={home || '/'}>{en ? 'Home' : '首页'}</a><span>›</span><a href={`${home || '/'}#use-cases`}>{en ? 'Use cases' : '常见场景'}</a><span>›</span><b>{scenario.title[locale]}</b></div>
        <section className="solution-hero">
          <span className="solution-hero-icon" aria-hidden="true">{scenario.icon}</span>
          <div className="solution-heading">
            <div className="detail-meta"><span>{en ? 'Developer reference' : '开发者参考方案'}</span><span>{scenario.audience[locale]}</span></div>
            <h1>{scenario.title[locale]}</h1>
            <p>{scenario.summary[locale]}</p>
          </div>
        </section>

        <article className="solution-content">
          <section>
            <span className="section-kicker">{en ? 'ARCHITECTURE' : '参考架构'}</span>
            <h2>{en ? 'Five-stage workflow' : '五步业务链路'}</h2>
            <div className="architecture-flow">{scenario.flow.map((step, index) => <div key={step.zh}><b>{String(index + 1).padStart(2, '0')}</b><span>{step[locale]}</span></div>)}</div>
          </section>

          <section>
            <span className="section-kicker">{en ? 'STACK' : '工具组合'}</span>
            <h2>{en ? 'Recommended components' : '推荐组件'}</h2>
            <p>{en ? 'Start with one component per capability and replace it only when evaluation data shows a clear gap.' : '每种能力先选择一个组件，只有评测数据证明存在明确短板时再替换或增加。'}</p>
            <div className="solution-tools">{tools.map((tool) => <a href={`${home}/tool/${tool.slug}`} key={tool.slug}><ToolLogo {...tool} className="mini-icon" locale={locale} /><span><b>{tool.name}</b><small>{categoryLabel(tool.category, locale)} · {en ? tool.descriptionEn : tool.description}</small></span><em>→</em></a>)}</div>
          </section>

          <section>
            <span className="section-kicker">{en ? 'DELIVERY' : '实施路线'}</span>
            <h2>{en ? 'From proof of concept to production' : '从验证到上线'}</h2>
            <ol className="delivery-list">{implementation.map((step, index) => <li key={step}><b>0{index + 1}</b><span>{step}</span></li>)}</ol>
          </section>

          <section>
            <span className="section-kicker">{en ? 'CODE SAMPLE' : '开发样例'}</span>
            <h2>{en ? 'Framework-neutral orchestration skeleton' : '与框架无关的编排骨架'}</h2>
            <div className="code-block"><div><span>TypeScript</span><CopyButton value={code} locale={locale} /></div><pre><code>{code}</code></pre></div>
            <p className="code-note">{en ? 'Replace the placeholder endpoint with server-side adapters for the selected components. Never expose provider credentials in browser code.' : '请在服务端用所选组件的适配器替换示例接口，任何供应商密钥都不要暴露在浏览器代码中。'}</p>
          </section>

          <section>
            <span className="section-kicker">{en ? 'LAUNCH CHECK' : '上线验收'}</span>
            <h2>{en ? 'Production checklist' : '生产检查清单'}</h2>
            <ul className="launch-checklist">{checks.map((check) => <li key={check}><span>✓</span>{check}</li>)}</ul>
          </section>
        </article>
      </div>
      <SiteFooter locale={locale} />
    </main>
  );
}
