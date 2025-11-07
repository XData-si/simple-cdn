import path from 'path';

/**
 * Normalize and validate file paths to prevent directory traversal
 */
export function normalizePath(inputPath: string): string {
  // Remove leading/trailing slashes
  let normalized = inputPath.replace(/^\/+|\/+$/g, '');

  // Resolve relative paths and remove ..
  normalized = path.normalize(normalized);

  // Prevent directory traversal
  if (normalized.includes('..')) {
    throw new Error('Invalid path: directory traversal not allowed');
  }

  // Convert backslashes to forward slashes
  normalized = normalized.replace(/\\/g, '/');

  return normalized;
}

/**
 * Validate file extension against allowlist
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  const allowed = ['.jpg', '.jpeg', '.png', '.svg'];
  return allowed.includes(ext);
}

/**
 * Extract file extension
 */
export function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Get filename without extension
 */
export function getBasename(filename: string): string {
  return path.basename(filename, path.extname(filename));
}

/**
 * Join paths safely
 */
export function joinPaths(...paths: string[]): string {
  return path.posix.join(...paths);
}
