import sharp from 'sharp';
import { join } from 'path';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import type { Config } from '../types';
import { logger } from '../utils/logger';
import { getExtension } from '../utils/path';

export class ThumbnailService {
  private config: Config;
  private thumbnailDir: string;

  constructor(config: Config) {
    this.config = config;
    this.thumbnailDir = join(config.storageRoot, '.thumbnails');
    this.ensureThumbnailDir();
  }

  private async ensureThumbnailDir() {
    if (!existsSync(this.thumbnailDir)) {
      await mkdir(this.thumbnailDir, { recursive: true });
      logger.info('Created thumbnail directory', { path: this.thumbnailDir });
    }
  }

  /**
   * Generate thumbnail for an image
   */
  async generate(sourcePath: string, fileName: string): Promise<string | null> {
    const ext = getExtension(fileName);

    // Only generate thumbnails for JPG and PNG
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
      return null;
    }

    try {
      const thumbnailFileName = `${fileName}.thumb${ext}`;
      const thumbnailPath = join(this.thumbnailDir, thumbnailFileName);

      // Skip if thumbnail already exists
      if (existsSync(thumbnailPath)) {
        return thumbnailFileName;
      }

      // Generate thumbnail
      await sharp(sourcePath)
        .resize(this.config.thumbnailSize, this.config.thumbnailSize, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: this.config.thumbnailQuality })
        .toFile(thumbnailPath);

      logger.debug('Thumbnail generated', {
        source: fileName,
        thumbnail: thumbnailFileName
      });

      return thumbnailFileName;
    } catch (error) {
      logger.error('Failed to generate thumbnail', {
        fileName,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Get thumbnail path for a file
   */
  getThumbnailPath(fileName: string): string {
    const ext = getExtension(fileName);
    const thumbnailFileName = `${fileName}.thumb${ext}`;
    return join(this.thumbnailDir, thumbnailFileName);
  }

  /**
   * Check if thumbnail exists
   */
  hasThumbnail(fileName: string): boolean {
    const thumbnailPath = this.getThumbnailPath(fileName);
    return existsSync(thumbnailPath);
  }

  /**
   * Delete thumbnail
   */
  async deleteThumbnail(fileName: string): Promise<void> {
    const thumbnailPath = this.getThumbnailPath(fileName);

    if (existsSync(thumbnailPath)) {
      await Bun.file(thumbnailPath).delete?.();
      logger.debug('Thumbnail deleted', { fileName });
    }
  }
}
