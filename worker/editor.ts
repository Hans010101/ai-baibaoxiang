import { localAdvisorPlan, normalizeAdvisorPlan, type AdvisorCandidate, type AdvisorLocale, type AdvisorPlan } from '../lib/advisor';

const allowedOrigins = new Set(['https://aiboxhub.top', 'https://www.aiboxhub.top', 'http://localhost:3000', 'http://127.0.0.1:3000']);
const encoder = new TextEncoder();

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error('provider_timeout')), milliseconds); }),
  ]).finally(() => clearTimeout(timer));
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  return origin && allowedOrigins.has(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, X-Aibox-Session',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  } : {};
}

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > maxBytes || !request.body) throw new Error('invalid_body');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) throw new Error('body_too_large');
    text += decoder.decode(value, { stream: true });
  }
  return JSON.parse(text + decoder.decode());
}

function advisorPayload(value: unknown) {
  if (!value || typeof value !== 'object') return;
  const body = value as Record<string, unknown>;
  if (typeof body.query !== 'string' || !body.query.trim() || body.query.length > 1000 || (body.locale !== 'zh' && body.locale !== 'en') || !Array.isArray(body.candidates)) return;
  const candidates = body.candidates.slice(0, 20).flatMap((item): AdvisorCandidate[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.slug !== 'string' || typeof candidate.name !== 'string' || typeof candidate.category !== 'string' || typeof candidate.description !== 'string' || !Array.isArray(candidate.tags) || candidate.status !== '已验证' || typeof candidate.free !== 'boolean' || typeof candidate.verifiedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate.verifiedAt)) return [];
    return [{
      slug: candidate.slug.slice(0, 120), name: candidate.name.slice(0, 160), category: candidate.category.slice(0, 120),
      description: candidate.description.slice(0, 600), tags: candidate.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 10),
      status: candidate.status, free: candidate.free, verifiedAt: candidate.verifiedAt,
    }];
  });
  if (!candidates.length) return;
  return { query: body.query.trim(), locale: body.locale as AdvisorLocale, candidates };
}

function parseModelResult(result: unknown): unknown {
  if (!result || typeof result !== 'object') throw new Error('empty_model_result');
  const record = result as Record<string, unknown>;
  const raw = record.response ?? ((record.choices as Array<{ message?: { content?: unknown } }> | undefined)?.[0]?.message?.content);
  if (typeof raw === 'string') return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''));
  if (raw && typeof raw === 'object') return raw;
  throw new Error('invalid_model_result');
}

function advisorPrompt(query: string, locale: AdvisorLocale, candidates: AdvisorCandidate[]) {
  return `You are the AI Toolbox product advisor. Reply only with the requested JSON. Use ${locale === 'en' ? 'English' : 'Simplified Chinese'}. Analyze the user's goal, give 2-4 actionable steps, and recommend only verified tools from the supplied candidates. Never invent a slug. Mention concrete fit and evidence date in each reason. If budget, traffic, data sensitivity, or technical stack would materially change the plan, ask one concise question in followUp.\nUser goal: ${query}\nVerified candidates: ${JSON.stringify(candidates)}`;
}

const advisorSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'object', properties: { slug: { type: 'string' }, role: { type: 'string' }, reason: { type: 'string' } }, required: ['slug', 'role', 'reason'] } },
    followUp: { type: 'string' },
  },
  required: ['summary', 'steps', 'recommendations', 'followUp'],
};

async function cloudflarePlan(env: Env, prompt: string) {
  return parseModelResult(await env.AI.run('@cf/zai-org/glm-4.7-flash', {
    messages: [{ role: 'user', content: prompt }], max_completion_tokens: 1800, reasoning_effort: 'low',
    response_format: { type: 'json_schema', json_schema: advisorSchema },
  }));
}

async function deepSeekPlan(env: Env, prompt: string) {
  const key = Reflect.get(env, 'DEEPSEEK_API_KEY');
  if (typeof key !== 'string' || !key) throw new Error('deepseek_not_configured');
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(20_000),
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({ model: 'deepseek-v4-flash', messages: [{ role: 'user', content: prompt }], response_format: { type: 'json_object' }, max_tokens: 1800 }),
  });
  if (!response.ok) throw new Error(`deepseek_${response.status}`);
  return parseModelResult(await response.json());
}

async function handleAdvisor(request: Request, env: Env) {
  const headers = cors(request);
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins.has(origin)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  const session = request.headers.get('X-Aibox-Session') ?? '';
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(session)) return new Response('Invalid session', { status: 400, headers });
  const rateKey = request.headers.get('CF-Connecting-IP') ?? session;
  if (!(await env.ADVISOR_RATE_LIMITER.limit({ key: rateKey })).success) return new Response('Too many requests', { status: 429, headers: { ...headers, 'Retry-After': '60' } });

  let payload;
  try { payload = advisorPayload(await readJson(request, 32_768)); } catch { /* handled as invalid input */ }
  if (!payload) return new Response('Invalid request', { status: 400, headers });
  const fallback = localAdvisorPlan(payload.query, payload.candidates, payload.locale);
  const prompt = advisorPrompt(payload.query, payload.locale, payload.candidates);
  let value: unknown;
  let provider: AdvisorPlan['provider'] = 'cloudflare';
  try {
    value = await withTimeout(cloudflarePlan(env, prompt), 10_000);
  } catch (error) {
    console.warn(JSON.stringify({ event: 'advisor_provider_failed', provider, error: String(error).slice(0, 180) }));
    provider = 'deepseek';
    try { value = await deepSeekPlan(env, prompt); }
    catch (error) {
      console.warn(JSON.stringify({ event: 'advisor_provider_failed', provider, error: String(error).slice(0, 180) }));
      console.log(JSON.stringify({ event: 'advisor_completed', provider: 'local', locale: payload.locale, recommendations: fallback.recommendations.length }));
      return Response.json(fallback, { headers: { ...headers, 'Cache-Control': 'no-store' } });
    }
  }
  const plan = normalizeAdvisorPlan(value, payload.candidates, fallback);
  console.log(JSON.stringify({ event: 'advisor_completed', provider, locale: payload.locale, recommendations: plan.recommendations.length }));
  return Response.json({ ...plan, provider }, { headers: { ...headers, 'Cache-Control': 'no-store' } });
}

async function handleEvent(request: Request) {
  const headers = cors(request);
  const origin = request.headers.get('Origin');
  if (!origin || !allowedOrigins.has(origin)) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
  let body: unknown;
  try { body = await readJson(request, 1024); } catch { return new Response('Invalid request', { status: 400, headers }); }
  if (!body || typeof body !== 'object') return new Response('Invalid request', { status: 400, headers });
  const { event, value, locale } = body as Record<string, unknown>;
  if ((event !== 'advisor_feedback' && event !== 'tool_open') || typeof value !== 'string' || value.length > 120 || (locale !== 'zh' && locale !== 'en')) return new Response('Invalid request', { status: 400, headers });
  console.log(JSON.stringify({ event, value, locale }));
  return new Response(null, { status: 204, headers: { ...headers, 'Cache-Control': 'no-store' } });
}

async function handleEditorial(request: Request, env: Env) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const tokenHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const safeEqual = crypto.subtle as SubtleCrypto & { timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean };
  if (!safeEqual.timingSafeEqual(encoder.encode(tokenHash), encoder.encode(env.EDITORIAL_TOKEN_SHA256))) return new Response('Unauthorized', { status: 401 });
  let body: unknown;
  try { body = await readJson(request, 70_000); } catch { return new Response('Invalid prompt', { status: 400 }); }
  const prompt = body && typeof body === 'object' ? (body as Record<string, unknown>).prompt : undefined;
  if (typeof prompt !== 'string' || !prompt.length || prompt.length > 60_000) return new Response('Invalid prompt', { status: 400 });
  const result = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
    messages: [{ role: 'user', content: prompt }], max_completion_tokens: 5000, reasoning_effort: 'low',
    response_format: { type: 'json_schema', json_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { description: { type: 'string' }, summary: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, useCases: { type: 'array', items: { type: 'string' } }, quickstart: { type: 'string' } }, required: ['description', 'summary', 'tags', 'useCases', 'quickstart'] } } }, required: ['items'] } },
  }) as { response?: unknown; choices?: Array<{ message?: { content?: string } }> };
  return Response.json({ response: result.response ?? result.choices?.[0]?.message?.content ?? '' });
}

export default {
  fetch(request, env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/advisor') return handleAdvisor(request, env);
    if (path === '/event') return handleEvent(request);
    if (path === '/editorial') return handleEditorial(request, env);
    return Promise.resolve(new Response('Not found', { status: 404 }));
  },
} satisfies ExportedHandler<Env>;
