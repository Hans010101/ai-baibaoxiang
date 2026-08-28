import type { Metadata } from 'next';
import { MethodologyPage } from '@/components/methodology-page';

export const metadata: Metadata = { title: '数据方法与隐私说明｜AI 百宝箱', description: '了解组件验证、免费信息、AI 助手数据处理和纠错机制。', alternates: { canonical: '/methodology', languages: { 'zh-CN': '/methodology', en: '/en/methodology', 'x-default': '/methodology' } } };
export default function Page() { return <MethodologyPage locale="zh" />; }
