/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

/**
 * Sanitize HTML/text input to prevent XSS attacks
 * Removes all HTML tags and scripts
 */
export function sanitizeText(input: string | null | undefined): string | null {
  if (!input) return null;

  // Remove all HTML tags, keeping only text content
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep text content
  });

  return sanitized.trim() || null;
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null; // Return null for dangerous URLs
    }
  }

  // Only allow http:// and https:// URLs
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      // Special handling for URLs
      if (key.toLowerCase().includes('url')) {
        sanitized[key] = sanitizeUrl(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value; // Keep non-string values as-is
    }
  }

  return sanitized as T;
}
