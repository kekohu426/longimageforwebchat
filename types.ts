
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

export enum AspectRatio {
  RATIO_16_9 = '16:9',
  RATIO_4_3 = '4:3',
  RATIO_1_1 = '1:1',
  FREE = 'Free'
}

export interface AppConfig {
  title: string;
  signature: string;
  content: string;
  images: string[];
  templateColor: string;
  aspectRatio: AspectRatio;
  fontFamily: string;
  fontSize: FontSize;
  margin: MarginSize;
  logo?: string;
  articleLink?: string;
  qrCodeImage?: string;
}

export interface Template {
  id: string;
  name: string;
  background: string;
  text: string;
  secondary: string;
}
