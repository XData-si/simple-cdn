import { describe, it, expect } from 'bun:test';
import { isSvgSafe, validateAndSanitizeSvg } from '../src/services/svg-sanitizer';

describe('SVG Sanitizer', () => {
  describe('isSvgSafe', () => {
    it('should accept safe SVG', () => {
      const safeSvg = '<svg><rect x="0" y="0" width="100" height="100" /></svg>';
      expect(isSvgSafe(safeSvg)).toBe(true);
    });

    it('should reject SVG with script tags', () => {
      const dangerousSvg = '<svg><script>alert("xss")</script></svg>';
      expect(isSvgSafe(dangerousSvg)).toBe(false);
    });

    it('should reject SVG with event handlers', () => {
      const dangerousSvg = '<svg onclick="alert(1)"><rect /></svg>';
      expect(isSvgSafe(dangerousSvg)).toBe(false);
    });

    it('should reject SVG with javascript: protocol', () => {
      const dangerousSvg = '<svg><a href="javascript:alert(1)">test</a></svg>';
      expect(isSvgSafe(dangerousSvg)).toBe(false);
    });
  });

  describe('validateAndSanitizeSvg', () => {
    it('should validate and sanitize safe SVG', () => {
      const safeSvg = '<svg><rect x="0" y="0" width="100" height="100" /></svg>';
      const result = validateAndSanitizeSvg(safeSvg);

      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject dangerous SVG', () => {
      const dangerousSvg = '<svg><script>alert("xss")</script></svg>';
      const result = validateAndSanitizeSvg(dangerousSvg);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-XML content', () => {
      const invalidSvg = 'not an svg';
      const result = validateAndSanitizeSvg(invalidSvg);

      expect(result.valid).toBe(false);
    });
  });
});
