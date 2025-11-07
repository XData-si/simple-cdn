import type { StorageAdapter, Config, ListResponse } from '../types';
import { ThumbnailService } from '../services/thumbnail';
import { validateAndSanitizeSvg } from '../services/svg-sanitizer';
import { logger } from '../utils/logger';
import { isAllowedExtension, normalizePath, getExtension } from '../utils/path';
import { join } from 'path';

export function apiRoutes(storage: StorageAdapter, thumbnailService: ThumbnailService, config: Config) {
  return {
    /**
     * GET /api/list?path=...
     * List files and folders
     */
    async list(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = url.searchParams.get('path') || '';

        const normalizedPath = path ? normalizePath(path) : '';
        const items = await storage.list(normalizedPath);

        // Add URLs and thumbnail URLs
        const enrichedItems = items.map(item => {
          const result = { ...item };

          if (item.type === 'file') {
            result.url = `${config.baseUrl}/cdn/${item.path}`;

            // Add thumbnail URL if available
            const ext = getExtension(item.name);
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
              result.thumbnailUrl = `${config.baseUrl}/api/thumbnail?path=${encodeURIComponent(item.path)}`;
            }
          }

          return result;
        });

        const totalSize = enrichedItems
          .filter(item => item.type === 'file')
          .reduce((sum, item) => sum + (item.size || 0), 0);

        const response: ListResponse = {
          path: normalizedPath,
          items: enrichedItems,
          totalSize,
          totalCount: enrichedItems.length,
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        logger.error('List error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Failed to list files' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * GET /api/thumbnail?path=...
     * Get or generate thumbnail
     */
    async thumbnail(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = url.searchParams.get('path');

        if (!path) {
          return new Response('Path required', { status: 400 });
        }

        const normalizedPath = normalizePath(path);

        // Check if file exists
        if (!await storage.exists(normalizedPath)) {
          return new Response('Not Found', { status: 404 });
        }

        const fileInfo = await storage.stat(normalizedPath);
        const fullPath = join(config.storageRoot, normalizedPath);

        // Generate thumbnail if needed
        const thumbnailFileName = await thumbnailService.generate(fullPath, fileInfo.name);

        if (!thumbnailFileName) {
          return new Response('Thumbnail not available', { status: 404 });
        }

        // Serve thumbnail
        const thumbnailPath = thumbnailService.getThumbnailPath(fileInfo.name);
        const file = Bun.file(thumbnailPath);

        return new Response(file, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch (error) {
        logger.error('Thumbnail error', { error });
        return new Response('Internal Server Error', { status: 500 });
      }
    },

    /**
     * POST /api/upload?path=...
     * Upload file
     */
    async upload(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const pathParam = url.searchParams.get('path') || '';
        const overwrite = url.searchParams.get('overwrite') === 'true';

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'No file provided' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Check file size
        if (file.size > config.maxUploadSize) {
          return new Response(
            JSON.stringify({
              error: 'Payload Too Large',
              message: `File size exceeds limit of ${config.maxUploadSize} bytes`
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Check file extension
        if (!isAllowedExtension(file.name)) {
          return new Response(
            JSON.stringify({
              error: 'Bad Request',
              message: 'Only JPG, PNG, and SVG files are allowed'
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const filePath = join(pathParam, file.name);
        const normalizedPath = normalizePath(filePath);

        // Check if file exists
        if (!overwrite && await storage.exists(normalizedPath)) {
          return new Response(
            JSON.stringify({
              error: 'Conflict',
              message: 'File already exists. Use overwrite=true to replace.'
            }),
            { status: 409, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Special handling for SVG
        if (getExtension(file.name) === '.svg') {
          const content = await file.text();
          const validation = validateAndSanitizeSvg(content);

          if (!validation.valid) {
            return new Response(
              JSON.stringify({
                error: 'Bad Request',
                message: validation.error || 'Invalid SVG file'
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
          }

          // Write sanitized SVG
          await storage.write(normalizedPath, Buffer.from(validation.sanitized!));
        } else {
          // Write file
          const buffer = await file.arrayBuffer();
          await storage.write(normalizedPath, Buffer.from(buffer));

          // Generate thumbnail for images
          const fullPath = join(config.storageRoot, normalizedPath);
          await thumbnailService.generate(fullPath, file.name);
        }

        logger.info('File uploaded', { path: normalizedPath, size: file.size });

        return new Response(
          JSON.stringify({
            success: true,
            path: normalizedPath,
            url: `${config.baseUrl}/cdn/${normalizedPath}`
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Upload error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Upload failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * POST /api/mkdir
     * Create directory
     */
    async mkdir(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { path } = body;

        if (!path) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Path required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const normalizedPath = normalizePath(path);
        await storage.mkdir(normalizedPath);

        logger.info('Directory created', { path: normalizedPath });

        return new Response(
          JSON.stringify({ success: true, path: normalizedPath }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Mkdir error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Failed to create directory' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * POST /api/move
     * Move file or directory
     */
    async move(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { src, dst } = body;

        if (!src || !dst) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Source and destination required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const normalizedSrc = normalizePath(src);
        const normalizedDst = normalizePath(dst);

        await storage.move(normalizedSrc, normalizedDst);

        logger.info('File moved', { src: normalizedSrc, dst: normalizedDst });

        return new Response(
          JSON.stringify({ success: true, src: normalizedSrc, dst: normalizedDst }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Move error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Failed to move file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * POST /api/rename
     * Rename file or directory
     */
    async rename(req: Request): Promise<Response> {
      try {
        const body = await req.json();
        const { path, newName } = body;

        if (!path || !newName) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Path and newName required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const normalizedPath = normalizePath(path);
        const dir = normalizedPath.includes('/') ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/')) : '';
        const newPath = dir ? `${dir}/${newName}` : newName;
        const normalizedNewPath = normalizePath(newPath);

        await storage.move(normalizedPath, normalizedNewPath);

        logger.info('File renamed', { oldPath: normalizedPath, newPath: normalizedNewPath });

        return new Response(
          JSON.stringify({ success: true, path: normalizedNewPath }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Rename error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Failed to rename file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },

    /**
     * DELETE /api/delete?path=...
     * Delete file or directory
     */
    async deleteFile(req: Request): Promise<Response> {
      try {
        const url = new URL(req.url);
        const path = url.searchParams.get('path');

        if (!path) {
          return new Response(
            JSON.stringify({ error: 'Bad Request', message: 'Path required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }

        const normalizedPath = normalizePath(path);

        // Delete thumbnail if exists
        const fileInfo = await storage.stat(normalizedPath);
        if (fileInfo.type === 'file') {
          await thumbnailService.deleteThumbnail(fileInfo.name);
        }

        await storage.delete(normalizedPath);

        logger.info('File deleted', { path: normalizedPath });

        return new Response(
          JSON.stringify({ success: true, path: normalizedPath }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        logger.error('Delete error', { error });
        return new Response(
          JSON.stringify({ error: 'Internal Server Error', message: 'Failed to delete file' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    },
  };
}
