import { v4 as uuidv4 } from 'uuid';
import {
  ImageDataset,
  ImageItem,
  DatasetMetadata,
  BatchOperation,
  DatasetExportFormat,
  CaptionGenerationConfig,
} from './types';

class DatasetService {
  private datasets: Map<string, ImageDataset> = new Map();

  // Create a new dataset
  async createDataset(path: string, name: string, description?: string): Promise<ImageDataset> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const metadata: DatasetMetadata = {
      name,
      description,
      created: now,
      modified: now,
      totalImages: 0,
      averageResolution: { width: 0, height: 0 },
      tags: [],
    };

    const dataset: ImageDataset = {
      id,
      path,
      images: [],
      metadata,
    };

    try {
      // Request the main process to scan the directory
      const images = await (window.api as any).scanDirectory(path);
      dataset.images = images.map((img: any) => ({
        id: uuidv4(),
        filename: img.name,
        path: img.path,
        caption: '',
        tags: [],
        metadata: img.metadata,
      }));

      // Update metadata
      dataset.metadata.totalImages = dataset.images.length;
      dataset.metadata.averageResolution = this.calculateAverageResolution(dataset.images);

      this.datasets.set(id, dataset);
      await this.saveDataset(dataset);

      return dataset;
    } catch (error) {
      console.error('Error creating dataset:', error);
      throw error;
    }
  }

  // Generate captions using LLM
  async generateCaptions(
    datasetId: string,
    config: CaptionGenerationConfig,
    imageIds?: string[]
  ): Promise<void> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const imagesToProcess = imageIds
      ? dataset.images.filter(img => imageIds.includes(img.id))
      : dataset.images;

    try {
      for (const image of imagesToProcess) {
        const caption = await (window.api as any).generateCaption({
          imagePath: image.path,
          ...config,
        });

        image.caption = caption;
      }

      dataset.metadata.modified = new Date().toISOString();
      await this.saveDataset(dataset);
    } catch (error) {
      console.error('Error generating captions:', error);
      throw error;
    }
  }

  // Batch edit operations
  async batchEdit(datasetId: string, operation: BatchOperation, imageIds?: string[]): Promise<void> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const imagesToProcess = imageIds
      ? dataset.images.filter(img => imageIds.includes(img.id))
      : dataset.images;

    for (const image of imagesToProcess) {
      switch (operation.type) {
        case 'replace':
          if (operation.target === 'caption' && operation.search) {
            image.caption = image.caption.replace(
              new RegExp(operation.search, 'g'),
              operation.replace || ''
            );
          } else if (operation.target === 'tags' && operation.search) {
            image.tags = image.tags.map(tag =>
              tag === operation.search ? operation.replace || '' : tag
            );
          }
          break;

        case 'append':
          if (operation.target === 'caption' && operation.value) {
            image.caption = `${image.caption} ${operation.value}`;
          } else if (operation.target === 'tags' && operation.value) {
            image.tags.push(operation.value);
          }
          break;

        case 'prepend':
          if (operation.target === 'caption' && operation.value) {
            image.caption = `${operation.value} ${image.caption}`;
          } else if (operation.target === 'tags' && operation.value) {
            image.tags.unshift(operation.value);
          }
          break;

        case 'remove':
          if (operation.target === 'tags' && operation.value) {
            image.tags = image.tags.filter(tag => tag !== operation.value);
          }
          break;

        case 'generate':
          if (operation.target === 'caption' && operation.config) {
            const caption = await (window.api as any).generateCaption({
              imagePath: image.path,
              ...operation.config,
            });
            image.caption = caption;
          }
          break;
      }
    }

    dataset.metadata.modified = new Date().toISOString();
    await this.saveDataset(dataset);
  }

  // Export dataset
  async exportDataset(datasetId: string, format: DatasetExportFormat, path: string): Promise<void> {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    try {
      await (window.api as any).exportDataset({
        dataset,
        format,
        outputPath: path,
      });
    } catch (error) {
      console.error('Error exporting dataset:', error);
      throw error;
    }
  }

  private calculateAverageResolution(images: ImageItem[]) {
    if (images.length === 0) return { width: 0, height: 0 };

    const total = images.reduce(
      (acc, img) => ({
        width: acc.width + img.metadata.width,
        height: acc.height + img.metadata.height,
      }),
      { width: 0, height: 0 }
    );

    return {
      width: Math.round(total.width / images.length),
      height: Math.round(total.height / images.length),
    };
  }

  private async saveDataset(dataset: ImageDataset): Promise<void> {
    try {
      await (window.api as any).saveDataset(dataset);
    } catch (error) {
      console.error('Error saving dataset:', error);
      throw error;
    }
  }
}

export const datasetService = new DatasetService();
