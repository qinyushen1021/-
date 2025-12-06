export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  content: string;
  category: 'policy' | 'industry' | 'tender' | 'safety' | 'hotspot';
  selected: boolean;
  url?: string;
  imageUrl?: string;
}

export interface GeneratedArticle {
  id: string;
  displayId: string; // e.g. "ART-240520-001"
  title: string;
  content: string; // Markdown content
  timestamp: number;
  previewText?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  GENERATOR = 'GENERATOR',
  IMAGE_GENERATOR = 'IMAGE_GENERATOR',
  HISTORY = 'HISTORY',
  MANUAL_IMPORT = 'MANUAL_IMPORT'
}

export interface GenerationConfig {
  tone: 'professional' | 'urgent' | 'emotional'; // 严肃 | 紧急 | 煽情
  focus: string; // e.g. "Focus on cost reduction"
}

export type ImageStyle = 'photorealistic' | 'infographic' | 'illustration' | '3d-render';
export type AspectRatio = '16:9' | '1:1' | '3:4' | '9:16';

export interface ImageGenerationConfig {
  style: ImageStyle;
  aspectRatio: AspectRatio;
}
