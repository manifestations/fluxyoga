export interface ImageDataset {
  id: string;
  path: string;
  images: ImageItem[];
  metadata: DatasetMetadata;
}

export interface ImageItem {
  id: string;
  filename: string;
  path: string;
  caption: string;
  tags: string[];
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasEXIF: boolean;
}

export interface DatasetMetadata {
  name: string;
  description?: string;
  created: string;
  modified: string;
  totalImages: number;
  averageResolution: {
    width: number;
    height: number;
  };
  tags: string[];
  captionTemplate?: string;
}

export interface DatasetStats {
  totalImages: number;
  processedImages: number;
  failedImages: number;
  uniqueTags: string[];
  resolutionGroups: {
    [key: string]: number;
  };
}

export interface CaptionGenerationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  template?: string;
  style?: string;
  focus?: string[];
}

export interface BatchOperation {
  type: 'replace' | 'append' | 'prepend' | 'remove' | 'generate';
  target: 'caption' | 'tags';
  search?: string;
  replace?: string;
  value?: string;
  config?: CaptionGenerationConfig;
}

export type DatasetExportFormat = 'json' | 'csv' | 'txt' | 'kohya';
