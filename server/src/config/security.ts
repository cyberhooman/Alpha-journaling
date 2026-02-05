/**
 * Security configuration and validation
 * This file ensures critical security settings are properly configured
 */

/**
 * Gets the JWT secret from environment variables
 * Throws an error if JWT_SECRET is not set to prevent using insecure defaults
 */
export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set. ' +
      'The application cannot start without a secure JWT secret. ' +
      'Please set JWT_SECRET in your .env file.'
    );
  }

  // Validate secret strength
  if (secret.length < 32) {
    throw new Error(
      'CRITICAL SECURITY ERROR: JWT_SECRET must be at least 32 characters long for security. ' +
      'Current length: ' + secret.length
    );
  }

  return secret;
}

/**
 * Validates that all required environment variables are set
 */
export function validateSecurityConfig(): void {
  getJWTSecret(); // This will throw if not properly configured

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const frontendUrl = (process.env.FRONTEND_URL || '').trim();
    const allowedOriginsRaw = (process.env.ALLOWED_ORIGINS || '').trim();

    const normalizeOrigin = (value: string): string => {
      const trimmed = value.trim().replace(/\/+$/, '');
      if (!trimmed) return '';
      try {
        const url = new URL(trimmed);
        return `${url.protocol}//${url.host}`;
      } catch {
        return trimmed;
      }
    };

    const looksLikePlaceholder = (value: string): boolean => {
      const lower = value.toLowerCase();
      return lower.includes('your-frontend-domain') || lower.includes('yourdomain.com');
    };

    const warnings: string[] = [];

    if (!frontendUrl) {
      warnings.push('FRONTEND_URL is not set (OAuth redirects will be wrong).');
    } else if (looksLikePlaceholder(frontendUrl)) {
      warnings.push(`FRONTEND_URL is still a placeholder: ${frontendUrl}`);
    }

    if (!allowedOriginsRaw) {
      warnings.push('ALLOWED_ORIGINS is not set (CORS may block the frontend).');
    } else if (looksLikePlaceholder(allowedOriginsRaw)) {
      warnings.push('ALLOWED_ORIGINS contains a placeholder domain.');
    }

    if (frontendUrl && allowedOriginsRaw) {
      const allowedOrigins = new Set(
        allowedOriginsRaw
          .split(',')
          .map(normalizeOrigin)
          .filter(Boolean)
      );
      if (!allowedOrigins.has(normalizeOrigin(frontendUrl))) {
        warnings.push('ALLOWED_ORIGINS does not include FRONTEND_URL.');
      }
    }

    if (warnings.length > 0) {
      console.warn('⚠️ Production config warnings:\n- ' + warnings.join('\n- '));
    }
  }

  console.log('✅ Security configuration validated');
}
