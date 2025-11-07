import type { StorageAdapter, Config } from '../types';
import { logger } from '../utils/logger';
import { matchesETag } from '../utils/etag';
import mime from 'mime-types';
import { getExtension } from '../utils/path';

export function cdnRoutes(storage: StorageAdapter, config: Config) {
  return {
    /**
     * GET /cdn/*
     * Serve static files with proper cache headers
     */
    async serveFile(path: string, req: Request): Promise<Response> {
      try {
        // Check if file exists
        if (!await storage.exists(path)) {
          return new Response('Not Found', { status: 404 });
        }

        // Get file info
        const fileInfo = await storage.stat(path);

        if (fileInfo.type === 'directory') {
          return new Response('Cannot serve directory', { status: 400 });
        }

        // Check If-None-Match (ETag)
        const ifNoneMatch = req.headers.get('If-None-Match');
        if (fileInfo.etag && matchesETag(fileInfo.etag, ifNoneMatch)) {
          return new Response(null, { status: 304 });
        }

        // Check If-Modified-Since
        const ifModifiedSince = req.headers.get('If-Modified-Since');
        if (ifModifiedSince && fileInfo.lastModified) {
          const modifiedTime = new Date(fileInfo.lastModified).getTime();
          const sinceTime = new Date(ifModifiedSince).getTime();

          if (modifiedTime <= sinceTime) {
            return new Response(null, { status: 304 });
          }
        }

        // Get file stream
        const stream = await storage.read(path);

        // Determine Content-Type
        const ext = getExtension(fileInfo.name);
        let contentType = fileInfo.mimeType || 'application/octet-stream';

        // Ensure correct Content-Type for SVG
        if (ext === '.svg') {
          contentType = 'image/svg+xml';
        }

        // Build headers
        const headers = new Headers({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Accept-Ranges': 'bytes',
        });

        if (fileInfo.etag) {
          headers.set('ETag', fileInfo.etag);
        }

        if (fileInfo.lastModified) {
          headers.set('Last-Modified', new Date(fileInfo.lastModified).toUTCString());
        }

        if (fileInfo.size !== undefined) {
          headers.set('Content-Length', fileInfo.size.toString());
        }

        // SVG-specific security headers
        if (ext === '.svg') {
          headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:;");
          headers.set('X-Content-Type-Options', 'nosniff');
        }

        // CORS for public access
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

        // Handle range requests
        const range = req.headers.get('Range');
        if (range && fileInfo.size) {
          // Parse range header (simplified, supports only single range)
          const match = range.match(/bytes=(\d+)-(\d*)/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? parseInt(match[2], 10) : fileInfo.size - 1;

            headers.set('Content-Range', `bytes ${start}-${end}/${fileInfo.size}`);
            headers.set('Content-Length', (end - start + 1).toString());

            // Note: Proper range implementation would slice the stream
            // For now, returning 206 status but full content (to be improved)
            return new Response(stream, { status: 206, headers });
          }
        }

        return new Response(stream, { status: 200, headers });
      } catch (error) {
        logger.error('File serving error', { path, error });
        return new Response('Internal Server Error', { status: 500 });
      }
    },
  };
}
