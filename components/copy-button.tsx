'use client';

import { useState } from 'react';

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button className="copy-button" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>{copied ? '已复制 ✓' : '复制'}</button>;
}
