import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  const path = request.nextUrl.pathname;
  headers.set('x-aibox-language', path === '/en' || path.startsWith('/en/') ? 'en' : 'zh-CN');
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/((?!_next|favicon.png|og.png).*)'] };
