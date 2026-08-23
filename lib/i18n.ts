export type Locale = 'zh' | 'en';

const categories: Record<string, string> = {
  '智能体框架': 'Agent Frameworks', 'MCP 服务': 'MCP Services', '云存储与文件': 'Cloud Storage & Files',
  '公共数据': 'Public Data', '动漫与娱乐': 'Anime & Entertainment', '动物与自然': 'Animals & Nature',
  '区块链与加密': 'Blockchain & Crypto', '商业与金融': 'Business & Finance', '天气与地理': 'Weather & Geography',
  '安全与认证': 'Security & Authentication', '开发者工具': 'Developer Tools', '政府与社会': 'Government & Society',
  '数据与校验': 'Data & Validation', '新闻与媒体': 'News & Media', '日历与活动': 'Calendar & Events',
  '模型与推理': 'Models & Inference', '模型与文本': 'Models & Text', '游戏与体育': 'Games & Sports',
  '知识与内容': 'Knowledge & Content', '科学与健康': 'Science & Health', '科学与研究': 'Science & Research',
  '网络服务': 'Web Services', '艺术与设计': 'Art & Design', '邮件与通信': 'Email & Communication',
  '金融数据': 'Financial Data', '音乐与视频': 'Music & Video',
};

export const categoryLabel = (value: string, locale: Locale) => locale === 'en' ? categories[value] ?? value : value;
export const typeLabel = (value: string, locale: Locale) => locale === 'en'
  ? ({ API: 'API', MCP: 'MCP Service', '模型': 'Model', SDK: 'SDK' }[value] ?? value)
  : ({ API: '开放接口', MCP: 'MCP 服务', '模型': '模型', SDK: '开发工具包' }[value] ?? value);
export const statusLabel = (value: string, locale: Locale) => locale === 'en'
  ? ({ '已验证': 'Verified', '待确认': 'Pending review' }[value] ?? value) : value;
export const authLabel = (value: string, locale: Locale) => locale === 'en'
  ? ({ '无需密钥': 'No key required', 'API 密钥': 'API key', '开放授权': 'OAuth', '以官方文档为准': 'See official docs', '取决于模型': 'Depends on model', '可选 API Key': 'Optional API key', '可选 Token': 'Optional token' }[value] ?? value)
  : value;
export const connectionLabel = (value: string, locale: Locale) => locale === 'en'
  ? ({ '支持': 'Supported', '不支持': 'Not supported', '未知': 'Unknown' }[value] ?? value) : value;
