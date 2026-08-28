import type { Metadata } from 'next';
import { MethodologyPage } from '@/components/methodology-page';

export const metadata: Metadata = { title: 'Data Methodology & Privacy | AI Toolbox', description: 'How AI Toolbox verifies components, handles free-tier claims, protects advisor data, and accepts corrections.', alternates: { canonical: '/en/methodology', languages: { 'zh-CN': '/methodology', en: '/en/methodology', 'x-default': '/methodology' } } };
export default function Page() { return <MethodologyPage locale="en" />; }
