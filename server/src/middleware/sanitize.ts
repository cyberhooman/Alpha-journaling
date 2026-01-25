/**
 * Middleware to automatically sanitize request bodies
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeText, sanitizeUrl } from '../utils/sanitize.js';

/**
 * Middleware to sanitize text fields in request body
 * This helps prevent XSS attacks by cleaning user input
 */
export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeBodyRecursive(req.body);
  }
  next();
}

function sanitizeBodyRecursive(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeBodyRecursive(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Special handling for URL fields
        if (key.toLowerCase().includes('url') || key.toLowerCase().includes('screenshot')) {
          sanitized[key] = sanitizeUrl(value);
        } else {
          // For text fields, sanitize but preserve line breaks
          sanitized[key] = sanitizeText(value);
        }
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeBodyRecursive(value);
      } else {
        // Keep non-string values as-is (numbers, booleans, etc.)
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}
