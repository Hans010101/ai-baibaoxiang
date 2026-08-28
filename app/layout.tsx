import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aiboxhub.top'),
  title: 'AI 百宝箱 - 找到、看懂、接入每一种 AI 能力',
  description: '持续发现并验证免费的 API、MCP、AI 模型、SDK 与 Agent 工具，提供中英文说明、免费额度、接入示例和官方链接。',
  applicationName: 'AI 百宝箱 / AI Toolbox',
  authors: [{ name: 'AI 百宝箱' }],
  creator: 'AI 百宝箱',
  publisher: 'AI 百宝箱',
  category: 'technology',
  icons: { icon: '/favicon.png' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    title: 'AI 百宝箱 - AI 组件黄页',
    description: '找到、看懂、接入每一种 AI 能力。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI 百宝箱' }],
    siteName: 'AI 百宝箱 / AI Toolbox',
    locale: 'zh_CN',
    alternateLocale: ['en_US'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 百宝箱 - AI 组件黄页',
    description: '找到、看懂、接入每一种 AI 能力。',
    images: ['/og.png'],
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const language = (await headers()).get('x-aibox-language') ?? 'zh-CN';
  return (
    <html lang={language}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
