import { mkdir, readdir, stat, unlink, rename, rm } from 'fs/promises';
import { createReadStream, createWriteStream, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import type { StorageAdapter, FileInfo } from '../types';
import { normalizePath, getExtension } from '../utils/path';
import { logger } from '../utils/logger';
import mime from 'mime-types';

export class LocalStorageAdapter implements StorageAdapter {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.ensureRootExists();
  }

  private async ensureRootExists() {
    if (!existsSync(this.rootPath)) {
      await mkdir(this.rootPath, { recursive: true });
      logger.info('Created storage root directory', { path: this.rootPath });
    }
  }

  private getAbsolutePath(path: string): string {
    const normalized = normalizePath(path);
    return join(this.rootPath, normalized);
  }

  async exists(path: string): Promise<boolean> {
    try {
      const absolutePath = this.getAbsolutePath(path);
      return existsSync(absolutePath);
    } catch (error) {
      return false;
    }
  }

  async read(path: string): Promise<ReadableStream> {
    const absolutePath = this.getAbsolutePath(path);

    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${path}`);
    }

    const fileStream = createReadStream(absolutePath);

    // Convert Node.js ReadableStream to Web ReadableStream
    return new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => {
          controller.enqueue(chunk);
        });

        fileStream.on('end', () => {
          controller.close();
        });

        fileStream.on('error', (error) => {
          controller.error(error);
        });
      },
      cancel() {
        fileStream.destroy();
      },
    });
  }

  async write(path: string, data: ReadableStream | Buffer): Promise<void> {
    const absolutePath = this.getAbsolutePath(path);
    const dir = dirname(absolutePath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    if (Buffer.isBuffer(data)) {
      // Write buffer directly
      await Bun.write(absolutePath, data);
    } else {
      // Stream to file
      const writeStream = createWriteStream(absolutePath);
      const reader = data.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writeStream.write(value);
        }

        writeStream.end();

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } finally {
        reader.releaseLock();
      }
    }

    logger.debug('File written', { path });
  }

  async delete(path: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(path);

    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${path}`);
    }

    const stats = await stat(absolutePath);

    if (stats.isDirectory()) {
      await rm(absolutePath, { recursive: true, force: true });
    } else {
      await unlink(absolutePath);
    }

    logger.debug('File deleted', { path });
  }

  async list(path: string = ''): Promise<FileInfo[]> {
    const absolutePath = path ? this.getAbsolutePath(path) : this.rootPath;

    if (!existsSync(absolutePath)) {
      return [];
    }

    const entries = await readdir(absolutePath, { withFileTypes: true });
    const files: FileInfo[] = [];

    for (const entry of entries) {
      // Skip hidden files and thumbnail directory
      if (entry.name.startsWith('.')) continue;

      const entryPath = join(path, entry.name);
      const absoluteEntryPath = join(absolutePath, entry.name);
      const stats = await stat(absoluteEntryPath);

      const fileInfo: FileInfo = {
        name: entry.name,
        path: entryPath,
        type: entry.isDirectory() ? 'directory' : 'file',
        lastModified: stats.mtime.toISOString(),
      };

      if (entry.isFile()) {
        fileInfo.size = stats.size;
        fileInfo.mimeType = mime.lookup(entry.name) || 'application/octet-stream';

        const ext = getExtension(entry.name);
        if (['.jpg', '.jpeg', '.png', '.svg'].includes(ext)) {
          fileInfo.etag = `"${stats.mtime.getTime()}-${stats.size}"`;
        }
      }

      files.push(fileInfo);
    }

    return files.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async mkdir(path: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(path);
    await mkdir(absolutePath, { recursive: true });
    logger.debug('Directory created', { path });
  }

  async move(src: string, dst: string): Promise<void> {
    const srcPath = this.getAbsolutePath(src);
    const dstPath = this.getAbsolutePath(dst);

    if (!existsSync(srcPath)) {
      throw new Error(`Source not found: ${src}`);
    }

    // Ensure destination directory exists
    const dstDir = dirname(dstPath);
    await mkdir(dstDir, { recursive: true });

    await rename(srcPath, dstPath);
    logger.debug('File moved', { src, dst });
  }

  async stat(path: string): Promise<FileInfo> {
    const absolutePath = this.getAbsolutePath(path);

    if (!existsSync(absolutePath)) {
      throw new Error(`File not found: ${path}`);
    }

    const stats = await stat(absolutePath);
    const name = basename(absolutePath);

    const fileInfo: FileInfo = {
      name,
      path,
      type: stats.isDirectory() ? 'directory' : 'file',
      lastModified: stats.mtime.toISOString(),
    };

    if (stats.isFile()) {
      fileInfo.size = stats.size;
      fileInfo.mimeType = mime.lookup(name) || 'application/octet-stream';
      fileInfo.etag = `"${stats.mtime.getTime()}-${stats.size}"`;
    }

    return fileInfo;
  }
}
