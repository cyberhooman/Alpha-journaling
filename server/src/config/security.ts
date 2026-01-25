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

  console.log('✅ Security configuration validated');
}
