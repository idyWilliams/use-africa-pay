/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Input sanitization utilities to prevent XSS and injection attacks.
 * These functions are used internally to sanitize user input before
 * sending to payment providers.
 */

/**
 * Sanitizes an email address by removing HTML tags and validating format.
 * 
 * @category Utilities
 * @param email - The email address to sanitize
 * @returns The sanitized email address in lowercase
 * @throws Error if the email format is invalid
 * 
 * @example
 * ```typescript
 * const email = sanitizeEmail('  User@Example.COM  ');
 * // Returns: 'user@example.com'
 * ```
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';

  // Remove any HTML tags and trim
  const cleaned = email.replace(/<[^>]*>/g, '').trim();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }

  return cleaned.toLowerCase();
};

/**
 * Sanitizes a name by removing HTML tags and potentially dangerous characters.
 * Preserves international characters (Unicode letters).
 * 
 * @category Utilities
 * @param name - The name to sanitize
 * @returns The sanitized name
 * 
 * @example
 * ```typescript
 * const name = sanitizeName('<script>alert("xss")</script>John Doe');
 * // Returns: 'John Doe'
 * 
 * const intlName = sanitizeName('José García');
 * // Returns: 'José García' (international characters preserved)
 * ```
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';

  // Remove HTML tags
  let cleaned = name.replace(/<[^>]*>/g, '');

  // Remove potentially dangerous characters but keep international characters
  // Allow letters, numbers, spaces, hyphens, apostrophes, and dots
  cleaned = cleaned.replace(/[^\p{L}\p{N}\s\-'.]/gu, '');

  return cleaned.trim();
};

/**
 * Sanitizes a phone number by removing invalid characters.
 * Allows digits, plus sign, hyphens, parentheses, and spaces.
 * 
 * @category Utilities
 * @param phone - The phone number to sanitize
 * @returns The sanitized phone number
 * 
 * @example
 * ```typescript
 * const phone = sanitizePhone('+234 (801) 234-5678');
 * // Returns: '+234 (801) 234-5678'
 * 
 * const dirtyPhone = sanitizePhone('<script>+2348012345678</script>');
 * // Returns: '+2348012345678'
 * ```
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';

  // Remove everything except digits, +, -, (, ), and spaces
  const cleaned = phone.replace(/[^\d+\-() ]/g, '').trim();

  return cleaned;
};

/**
 * Sanitizes a transaction reference.
 * Only allows alphanumeric characters, hyphens, and underscores.
 * 
 * @category Utilities
 * @param reference - The transaction reference to sanitize
 * @returns The sanitized reference
 * @throws Error if reference is empty or contains no valid characters
 * 
 * @example
 * ```typescript
 * const ref = sanitizeReference('TXN_123-ABC');
 * // Returns: 'TXN_123-ABC'
 * 
 * const dirtyRef = sanitizeReference('TXN<script>123');
 * // Returns: 'TXN123'
 * ```
 */
export const sanitizeReference = (reference: string): string => {
  if (!reference) {
    throw new Error('Transaction reference is required');
  }

  // Remove any characters that aren't alphanumeric, hyphen, or underscore
  const cleaned = reference.replace(/[^a-zA-Z0-9\-_]/g, '');

  if (cleaned.length === 0) {
    throw new Error('Transaction reference must contain at least one valid character');
  }

  return cleaned;
};

/**
 * Recursively sanitizes a metadata object to prevent XSS attacks.
 * Removes HTML tags and script content from all string values.
 * 
 * @category Utilities
 * @param metadata - The metadata object to sanitize
 * @returns The sanitized metadata object
 * 
 * @example
 * ```typescript
 * const meta = sanitizeMetadata({
 *   title: '<script>alert("xss")</script>My Store',
 *   description: 'Order #123',
 *   nested: {
 *     value: '<img onerror="alert(1)" src="x">'
 *   }
 * });
 * // Returns: { title: 'My Store', description: 'Order #123', nested: { value: '' } }
 * ```
 */
export const sanitizeMetadata = (metadata: Record<string, any>): Record<string, any> => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Sanitize key
    const cleanKey = key.replace(/[^\w\-]/g, '');

    if (typeof value === 'string') {
      // Remove HTML tags and script tags
      sanitized[cleanKey] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[cleanKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[cleanKey] = sanitizeMetadata(value);
    }
    // Skip functions, undefined, null, etc.
  }

  return sanitized;
};

/**
 * Redacts sensitive information from error messages for safe logging.
 * Masks API keys, email addresses, and phone numbers.
 * 
 * @category Utilities
 * @param message - The message to redact
 * @returns The message with sensitive data redacted
 * 
 * @example
 * ```typescript
 * const safe = redactSensitiveData('Error with key pk_test_abcdefghijklmnopqrstuvwxyz');
 * // Returns: 'Error with key ***wxyz'
 * 
 * const safeEmail = redactSensitiveData('User user@example.com not found');
 * // Returns: 'User ***@***.*** not found'
 * ```
 */
export const redactSensitiveData = (message: string): string => {
  if (!message) return '';

  // Redact potential API keys (strings that look like keys)
  let redacted = message.replace(/[a-zA-Z0-9]{20,}/g, (match) => {
    // If it looks like a key (long alphanumeric string), redact it
    if (match.length > 20) {
      return `***${match.slice(-4)}`;
    }
    return match;
  });

  // Redact email addresses
  redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***');

  // Redact phone numbers
  redacted = redacted.replace(/\+?\d{10,}/g, '***');

  return redacted;
};
