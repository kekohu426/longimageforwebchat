import { Template } from './types';

export const TEMPLATES: Template[] = [
  {
    id: 'minimal-white',
    name: '简约白',
    description: '干净留白，适合知识分享',
    background: '#f8fafc',
    cardBg: '#ffffff',
    text: '#1e293b',
    secondary: '#64748b',
    accent: '#3b82f6'
  },
  {
    id: 'business-blue',
    name: '商务蓝',
    description: '专业可信，适合行业资讯',
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    cardBg: '#ffffff',
    text: '#1e293b',
    secondary: '#64748b',
    accent: '#2563eb'
  },
  {
    id: 'energy-orange',
    name: '活力橙',
    description: '醒目抓眼，适合营销推广',
    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    cardBg: '#ffffff',
    text: '#1e293b',
    secondary: '#64748b',
    accent: '#ea580c'
  },
  {
    id: 'premium-black',
    name: '高级黑',
    description: '质感高端，适合品牌故事',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    cardBg: 'rgba(255, 255, 255, 0.95)',
    text: '#0f172a',
    secondary: '#475569',
    accent: '#d4a574'
  },
  {
    id: 'fresh-green',
    name: '清新绿',
    description: '自然舒适，适合生活方式',
    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    cardBg: '#ffffff',
    text: '#1e293b',
    secondary: '#64748b',
    accent: '#059669'
  },
  {
    id: 'elegant-purple',
    name: '优雅紫',
    description: '文艺气质，适合创意内容',
    background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    cardBg: '#ffffff',
    text: '#1e293b',
    secondary: '#64748b',
    accent: '#7c3aed'
  }
];

export const FONTS = [
  { name: '思源黑体', value: 'font-sans' },
  { name: '宋体', value: 'font-serif' },
  { name: '等宽字体', value: 'font-mono' }
];

// 卡片君工具推广链接（占位）
export const TOOL_PROMO_LINK = 'https://kapianjun.com';
export const TOOL_BRAND_NAME = '卡片君';
