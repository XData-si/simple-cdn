import { createHash } from 'crypto';

/**
 * Generate ETag from buffer
 */
export function generateETag(data: Buffer): string {
  const hash = createHash('md5').update(data).digest('hex');
  return `"${hash}"`;
}

/**
 * Generate weak ETag from file stats
 */
export function generateWeakETag(size: number, mtime: number): string {
  return `W/"${size.toString(16)}-${mtime.toString(16)}"`;
}

/**
 * Check if ETag matches
 */
export function matchesETag(etag: string, ifNoneMatch?: string): boolean {
  if (!ifNoneMatch) return false;

  const tags = ifNoneMatch.split(',').map(t => t.trim());
  return tags.includes('*') || tags.includes(etag);
}
