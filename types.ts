export enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum MarginSize {
  COMPACT = 'compact',
  STANDARD = 'standard',
  LOOSE = 'loose'
}

export enum CardSize {
  SQUARE = '1:1',      // 1080x1080 正方形
  PORTRAIT = '3:4',    // 1080x1440 竖图（推荐）
  LONG = 'auto'        // 自适应长图
}

export interface AppConfig {
  title: string;
  signature: string;
  content: string;
  images: string[];
  templateId: string;
  cardSize: CardSize;
  fontFamily: string;
  fontSize: FontSize;
  margin: MarginSize;
  logo?: string;
  // 文章二维码
  articleLink: string;
  articleQrText: string;
  // 工具推广二维码
  toolLink: string;
  toolQrText: string;
  showToolQr: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  background: string;
  cardBg: string;
  text: string;
  secondary: string;
  accent: string;
}
