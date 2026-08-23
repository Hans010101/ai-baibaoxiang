import type { Metadata } from 'next';
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
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: 'AI 百宝箱 - AI 组件黄页',
    description: '找到、看懂、接入每一种 AI 能力。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI 百宝箱' }],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 百宝箱 - AI 组件黄页',
    description: '找到、看懂、接入每一种 AI 能力。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
