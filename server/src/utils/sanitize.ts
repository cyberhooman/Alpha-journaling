/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize HTML/text input to prevent XSS attacks
 * Removes all HTML tags and scripts
 */
export function sanitizeText(input: string | null | undefined): string {
  if (input == null) return '';

  // Strip dangerous HTML — script/style tags and all other HTML tags.
  // Do NOT re-encode the remaining text: data is stored in a database and
  // served as JSON. React handles XSS prevention at render time via textContent.
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '');

  return sanitized.trim();
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';

  const trimmed = url.trim();

  // Block obviously dangerous protocols before attempting to parse.
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return '';
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
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
      if (!value) {
        sanitized[key] = value;
      } else if (key.toLowerCase().includes('screenshot')) {
        sanitized[key] = value;
      } else if (key.toLowerCase().includes('url')) {
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
