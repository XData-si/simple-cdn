import { describe, it, expect } from 'bun:test';
import { generateETag, matchesETag, generateWeakETag } from '../src/utils/etag';

describe('ETag utilities', () => {
  describe('generateETag', () => {
    it('should generate consistent ETags for same content', () => {
      const content = Buffer.from('hello world');
      const etag1 = generateETag(content);
      const etag2 = generateETag(content);

      expect(etag1).toBe(etag2);
    });

    it('should generate different ETags for different content', () => {
      const content1 = Buffer.from('hello');
      const content2 = Buffer.from('world');

      expect(generateETag(content1)).not.toBe(generateETag(content2));
    });

    it('should wrap ETag in quotes', () => {
      const content = Buffer.from('test');
      const etag = generateETag(content);

      expect(etag.startsWith('"')).toBe(true);
      expect(etag.endsWith('"')).toBe(true);
    });
  });

  describe('generateWeakETag', () => {
    it('should generate weak ETag', () => {
      const etag = generateWeakETag(1024, Date.now());
      expect(etag.startsWith('W/"')).toBe(true);
    });
  });

  describe('matchesETag', () => {
    it('should match exact ETag', () => {
      const etag = '"abc123"';
      expect(matchesETag(etag, '"abc123"')).toBe(true);
    });

    it('should match wildcard', () => {
      const etag = '"abc123"';
      expect(matchesETag(etag, '*')).toBe(true);
    });

    it('should not match different ETags', () => {
      const etag = '"abc123"';
      expect(matchesETag(etag, '"xyz789"')).toBe(false);
    });

    it('should handle multiple ETags', () => {
      const etag = '"abc123"';
      expect(matchesETag(etag, '"xyz", "abc123", "def"')).toBe(true);
    });

    it('should return false when no If-None-Match', () => {
      const etag = '"abc123"';
      expect(matchesETag(etag, undefined)).toBe(false);
    });
  });
});
