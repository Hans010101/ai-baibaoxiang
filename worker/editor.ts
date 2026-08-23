interface Env {
  AI: Ai;
  EDITORIAL_TOKEN_SHA256: string;
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const tokenHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    if (tokenHash !== env.EDITORIAL_TOKEN_SHA256) return new Response('Unauthorized', { status: 401 });

    const { prompt } = await request.json<{ prompt?: unknown }>();
    if (typeof prompt !== 'string' || !prompt.length || prompt.length > 60_000) return new Response('Invalid prompt', { status: 400 });

    const result = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
    }) as { response?: string; choices?: Array<{ message?: { content?: string } }> };
    return Response.json({ response: result.response ?? result.choices?.[0]?.message?.content ?? '' });
  },
} satisfies ExportedHandler<Env>;
