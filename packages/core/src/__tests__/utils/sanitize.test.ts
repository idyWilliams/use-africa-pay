import { describe, it, expect } from 'vitest';
import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeReference,
  sanitizeMetadata,
  redactSensitiveData,
  parseUserName,
} from '../../utils/sanitize';

describe('sanitize utils', () => {
  describe('sanitizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(sanitizeEmail('  Test@Example.Com  ')).toBe('test@example.com');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeEmail('test<b>@example.com</b>')).toBe('test@example.com');
    });

    it('should throw error for invalid email', () => {
      expect(() => sanitizeEmail('invalid-email')).toThrow('Invalid email format');
    });
  });

  describe('sanitizeName', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeName('John <b>Doe</b>')).toBe('John Doe');
    });

    it('should keep international characters', () => {
      expect(sanitizeName('José-María O\'Connor')).toBe('José-María O\'Connor');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeName('John <script>alert(1)</script> Doe')).toBe('John alert(1) Doe');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only valid phone characters', () => {
      expect(sanitizePhone('+234 (801) 234-5678 ')).toBe('+234 (801) 234-5678');
    });

    it('should remove invalid characters', () => {
      expect(sanitizePhone('+234 abc 123')).toBe('+234 123');
    });
  });

  describe('sanitizeReference', () => {
    it('should keep alphanumeric characters, hyphens and underscores', () => {
      expect(sanitizeReference('REF-123_abc')).toBe('REF-123_abc');
    });

    it('should remove other characters', () => {
      expect(sanitizeReference('REF!@#123')).toBe('REF123');
    });

    it('should throw error if empty', () => {
      expect(() => sanitizeReference('')).toThrow('Transaction reference is required');
    });
  });

  describe('sanitizeMetadata', () => {
    it('should recursively sanitize objects', () => {
      const metadata = {
        name: '<b>John</b>',
        info: {
          note: '<script>alert(1)</script>',
        },
        count: 10,
        active: true,
      };
      const result = sanitizeMetadata(metadata);
      expect(result.name).toBe('John');
      expect(result.info.note).toBe('');
      expect(result.count).toBe(10);
      expect(result.active).toBe(true);
    });
  });

  describe('redactSensitiveData', () => {
    it('should redact long alphanumeric strings (API keys)', () => {
      const message = 'Error using key pk_live_123456789012345678901234567890';
      expect(redactSensitiveData(message)).toContain('***4567890');
    });

    it('should redact emails', () => {
      const message = 'Contact widorenyin0@gmail.com for help';
      expect(redactSensitiveData(message)).toBe('Contact ***@***.*** for help');
    });

    it('should redact phone numbers', () => {
      const message = 'Call +2348012345678';
      expect(redactSensitiveData(message)).toBe('Call ***');
    });
  });

  describe('parseUserName', () => {
    it('should use explicit firstName and lastName', () => {
      expect(parseUserName({ email: 'test@test.com', firstName: 'John', lastName: 'Doe' })).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should strip titles', () => {
      expect(parseUserName({ email: 'test@test.com', name: 'Dr. John Smith' })).toEqual({
        firstName: 'John',
        lastName: 'Smith',
      });
    });

    it('should handle single names', () => {
      expect(parseUserName({ email: 'test@test.com', name: 'Madonna' })).toEqual({
        firstName: 'Madonna',
        lastName: 'Madonna',
      });
    });

    it('should handle multi-part names', () => {
      expect(parseUserName({ email: 'test@test.com', name: 'John Michael Doe' })).toEqual({
        firstName: 'John',
        lastName: 'Michael Doe',
      });
    });
  });
});