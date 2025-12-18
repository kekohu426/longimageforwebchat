
import { Template } from './types';

export const TEMPLATES: Template[] = [
  {
    id: 'lavender',
    name: 'Lavender',
    background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
    text: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)'
  },
  {
    id: 'dark',
    name: 'Midnight',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    text: '#f8fafc',
    secondary: 'rgba(248, 250, 252, 0.7)'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    text: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)'
  },
  {
    id: 'forest',
    name: 'Forest',
    background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
    text: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
    text: '#1e293b',
    secondary: '#64748b'
  }
];

export const FONTS = [
  { name: '思源黑体 (Default)', value: 'font-sans' },
  { name: '古典宋体 (Serif)', value: 'font-serif' },
  { name: '极客代码 (Mono)', value: 'font-mono-jb' },
  { name: '手写艺术 (Handwriting)', value: 'font-handwriting' }
];
