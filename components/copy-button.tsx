'use client';

import { useState } from 'react';

export function CopyButton({ value, locale = 'zh' }: { value: string; locale?: 'zh' | 'en' }) {
  const [copied, setCopied] = useState(false);
  return <button className="copy-button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? (locale === 'en' ? 'Copied ✓' : '已复制 ✓') : (locale === 'en' ? 'Copy' : '复制')}</button>;
}
