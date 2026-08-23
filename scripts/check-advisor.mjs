import assert from 'node:assert/strict';
import { localAdvisorPlan, rankAdvisorCandidates } from '../lib/advisor.ts';

const tools = [
  { slug: 'weather', name: 'Weather API', category: '天气与地理', description: '实时天气预报', tags: ['天气'], status: '已验证', free: true },
  { slug: 'mail', name: 'Mail API', category: '邮件与通信', description: '发送邮件', tags: ['邮件'], status: '已验证', free: true },
];

const ranked = rankAdvisorCandidates('旅行天气提醒', tools);
assert.equal(ranked[0].slug, 'weather');
assert.deepEqual(localAdvisorPlan('天气提醒', ranked, 'zh').recommendations.map(({ slug }) => slug), ['weather']);
console.log('advisor check passed');
