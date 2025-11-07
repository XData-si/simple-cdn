import sanitizeHtml from 'sanitize-html';
import { logger } from '../utils/logger';

/**
 * Sanitize SVG content to remove potentially dangerous scripts
 */
export function sanitizeSvg(svgContent: string): string {
  const sanitized = sanitizeHtml(svgContent, {
    allowedTags: [
      'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
      'text', 'tspan', 'defs', 'linearGradient', 'radialGradient', 'stop',
      'pattern', 'clipPath', 'mask', 'use', 'image', 'title', 'desc', 'metadata',
    ],
    allowedAttributes: {
      '*': [
        'id', 'class', 'style', 'transform', 'fill', 'stroke', 'stroke-width',
        'opacity', 'fill-opacity', 'stroke-opacity', 'x', 'y', 'width', 'height',
        'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points', 'd',
        'viewBox', 'preserveAspectRatio', 'xmlns', 'xmlns:xlink',
      ],
      use: ['href', 'xlink:href'],
      image: ['href', 'xlink:href'],
    },
    allowedSchemes: ['http', 'https', 'data'],
    allowedSchemesByTag: {
      image: ['http', 'https', 'data'],
    },
  });

  return sanitized;
}

/**
 * Check if SVG contains potentially dangerous content
 */
export function isSvgSafe(svgContent: string): boolean {
  // Check for script tags
  if (/<script/i.test(svgContent)) {
    logger.warn('SVG contains script tag');
    return false;
  }

  // Check for event handlers
  if (/on\w+\s*=/i.test(svgContent)) {
    logger.warn('SVG contains event handlers');
    return false;
  }

  // Check for javascript: protocol
  if (/javascript:/i.test(svgContent)) {
    logger.warn('SVG contains javascript protocol');
    return false;
  }

  // Check for data URLs with script content
  if (/data:.*script/i.test(svgContent)) {
    logger.warn('SVG contains data URL with script');
    return false;
  }

  return true;
}

/**
 * Validate and sanitize SVG upload
 */
export function validateAndSanitizeSvg(svgContent: string): { valid: boolean; sanitized?: string; error?: string } {
  // Basic validation
  if (!svgContent.trim().startsWith('<')) {
    return { valid: false, error: 'Invalid SVG: does not start with XML tag' };
  }

  // Check for dangerous content
  if (!isSvgSafe(svgContent)) {
    return { valid: false, error: 'SVG contains potentially dangerous content (scripts, event handlers)' };
  }

  // Sanitize
  try {
    const sanitized = sanitizeSvg(svgContent);
    return { valid: true, sanitized };
  } catch (error) {
    logger.error('SVG sanitization failed', { error });
    return { valid: false, error: 'SVG sanitization failed' };
  }
}
