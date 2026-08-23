export type AdvisorLocale = 'zh' | 'en';

export type AdvisorCandidate = {
  slug: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  status: string;
  free: boolean;
};

export type AdvisorPlan = {
  summary: string;
  steps: string[];
  recommendations: Array<{ slug: string; role: string; reason: string }>;
  followUp?: string;
  provider?: 'cloudflare' | 'deepseek' | 'local';
};

const synonyms: Record<string, string[]> = {
  客服: ['对话', '聊天', '智能体', 'agent', 'chatbot', 'text'],
  电商: ['商业', '支付', '商品', 'business', 'commerce', 'shopping'],
  图片: ['图像', '视觉', 'image', 'photo', 'vision', 'design'],
  视频: ['video', 'media', '影音'],
  语音: ['voice', 'speech', 'audio', '音乐'],
  翻译: ['translation', 'language', '文本'],
  搜索: ['search', '检索', '知识', '数据'],
  数据: ['data', '数据库', '分析', 'dataset'],
  自动化: ['automation', 'workflow', 'agent', '智能体'],
  地图: ['map', 'location', '地理', '位置'],
  天气: ['weather', '气象', '地理'],
  金融: ['finance', '股票', '行情', '支付'],
};

const normalize = (value: string) => value.toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]+/gu, ' ').trim();

export function rankAdvisorCandidates(query: string, items: AdvisorCandidate[], limit = 12) {
  const normalized = normalize(query);
  const terms = new Set(normalized.split(' ').filter((term) => term.length > 1));
  for (const [key, values] of Object.entries(synonyms)) {
    if (normalized.includes(key) || values.some((value) => normalized.includes(value))) {
      terms.add(key);
      values.forEach((value) => terms.add(value));
    }
  }

  return items
    .map((item, index) => {
      const name = normalize(item.name);
      const category = normalize(item.category);
      const tags = normalize(item.tags.join(' '));
      const description = normalize(item.description);
      let score = name === normalized ? 100 : name.includes(normalized) && normalized.length > 1 ? 25 : 0;
      for (const term of terms) {
        if (name.includes(term)) score += 8;
        if (category.includes(term)) score += 5;
        if (tags.includes(term)) score += 4;
        if (description.includes(term)) score += 2;
      }
      if (score && item.status === '已验证') score += 1;
      return { item, score, index };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ item }) => item);
}

export function localAdvisorPlan(query: string, candidates: AdvisorCandidate[], locale: AdvisorLocale): AdvisorPlan {
  const selected = candidates.slice(0, 4);
  const en = locale === 'en';
  return {
    summary: en
      ? `For “${query}”, start with a small, verifiable workflow and combine the tools below only where needed.`
      : `针对“${query}”，建议先搭建一个可验证的小闭环，再按需组合下面的工具。`,
    steps: en
      ? ['Define the input, expected output, and success metric.', 'Validate the core workflow with one primary tool.', 'Add alternatives and safeguards after the first result works.']
      : ['明确输入、预期输出和成功指标。', '先用一个主工具跑通核心流程。', '首个结果可用后，再补充备选工具与安全措施。'],
    recommendations: selected.map((item, index) => ({
      slug: item.slug,
      role: en ? (index ? 'Alternative / extension' : 'Primary option') : (index ? '备选或扩展' : '首选工具'),
      reason: en ? `${item.name} matches this need through ${item.category}.` : `${item.name} 可通过“${item.category}”能力支持这项需求。`,
    })),
    followUp: en ? 'Tell me your budget, traffic, and technical stack for a narrower plan.' : '补充预算、预计流量和技术栈后，我可以继续缩小方案范围。',
    provider: 'local',
  };
}

export function normalizeAdvisorPlan(value: unknown, candidates: AdvisorCandidate[], fallback: AdvisorPlan): AdvisorPlan {
  if (!value || typeof value !== 'object') return fallback;
  const object = value as Record<string, unknown>;
  const allowed = new Set(candidates.map((item) => item.slug));
  const recommendations = Array.isArray(object.recommendations) ? object.recommendations.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Record<string, unknown>;
    return typeof record.slug === 'string' && allowed.has(record.slug) && typeof record.role === 'string' && typeof record.reason === 'string'
      ? [{ slug: record.slug, role: record.role.slice(0, 80), reason: record.reason.slice(0, 240) }]
      : [];
  }).slice(0, 5) : [];
  const steps = Array.isArray(object.steps) ? object.steps.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
  return {
    summary: typeof object.summary === 'string' ? object.summary.slice(0, 500) : fallback.summary,
    steps: steps.length ? steps : fallback.steps,
    recommendations: recommendations.length ? recommendations : fallback.recommendations,
    followUp: typeof object.followUp === 'string' ? object.followUp.slice(0, 300) : fallback.followUp,
  };
}
