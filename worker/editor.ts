interface Env {
  AI: Ai;
  EDITORIAL_API_TOKEN: string;
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    if (request.headers.get('Authorization') !== `Bearer ${env.EDITORIAL_API_TOKEN}`) return new Response('Unauthorized', { status: 401 });

    const { prompt } = await request.json<{ prompt?: unknown }>();
    if (typeof prompt !== 'string' || !prompt.length || prompt.length > 60_000) return new Response('Invalid prompt', { status: 400 });

    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
    });
    return Response.json(result);
  },
} satisfies ExportedHandler<Env>;
