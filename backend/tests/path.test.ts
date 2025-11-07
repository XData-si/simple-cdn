import { describe, it, expect } from 'bun:test';
import { normalizePath, isAllowedExtension, getExtension } from '../src/utils/path';

describe('Path utilities', () => {
  describe('normalizePath', () => {
    it('should remove leading and trailing slashes', () => {
      expect(normalizePath('/foo/bar/')).toBe('foo/bar');
      expect(normalizePath('foo/bar')).toBe('foo/bar');
    });

    it('should prevent directory traversal', () => {
      expect(() => normalizePath('../etc/passwd')).toThrow('directory traversal');
      expect(() => normalizePath('foo/../../bar')).toThrow('directory traversal');
    });

    it('should convert backslashes to forward slashes', () => {
      expect(normalizePath('foo\\bar')).toBe('foo/bar');
    });
  });

  describe('isAllowedExtension', () => {
    it('should allow JPG, PNG, SVG', () => {
      expect(isAllowedExtension('image.jpg')).toBe(true);
      expect(isAllowedExtension('image.jpeg')).toBe(true);
      expect(isAllowedExtension('image.png')).toBe(true);
      expect(isAllowedExtension('image.svg')).toBe(true);
    });

    it('should reject other extensions', () => {
      expect(isAllowedExtension('file.txt')).toBe(false);
      expect(isAllowedExtension('file.pdf')).toBe(false);
      expect(isAllowedExtension('file.exe')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isAllowedExtension('image.JPG')).toBe(true);
      expect(isAllowedExtension('image.PNG')).toBe(true);
    });
  });

  describe('getExtension', () => {
    it('should extract file extension', () => {
      expect(getExtension('image.jpg')).toBe('.jpg');
      expect(getExtension('file.tar.gz')).toBe('.gz');
    });

    it('should return lowercase', () => {
      expect(getExtension('IMAGE.JPG')).toBe('.jpg');
    });
  });
});
