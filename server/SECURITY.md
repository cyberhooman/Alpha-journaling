# Security Documentation

This document outlines the security measures implemented in the Trading Journal application and best practices for maintaining security.

## Table of Contents

1. [Security Features](#security-features)
2. [Configuration](#configuration)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation & Sanitization](#input-validation--sanitization)
5. [Rate Limiting](#rate-limiting)
6. [Security Headers](#security-headers)
7. [Database Security](#database-security)
8. [Best Practices](#best-practices)
9. [Security Checklist](#security-checklist)

---

## Security Features

### Implemented Security Measures

✅ **JWT Authentication** with secure token management
✅ **Password Hashing** using bcrypt (10 salt rounds)
✅ **Token Blacklist** for proper logout functionality
✅ **Rate Limiting** to prevent brute force attacks
✅ **CORS Protection** with whitelist-based origin validation
✅ **Security Headers** via Helmet.js
✅ **Input Sanitization** to prevent XSS attacks
✅ **SQL Injection Protection** via parameterized queries
✅ **SSL/TLS Verification** for database connections
✅ **Strong Password Requirements**
✅ **Automatic Token Cleanup** to prevent database bloat

---

## Configuration

### Required Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# JWT Secret - CRITICAL!
# Generate using: openssl rand -base64 32 (Linux/Mac)
# Or: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=your-secure-random-string-at-least-32-characters

# Allowed CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://yourdomain.com

# Database URL
DATABASE_URL=postgresql://user:password@host:port/database

# Server Port
PORT=5000

# Environment
NODE_ENV=production
```

### Critical Security Requirements

1. **JWT_SECRET** - MUST be at least 32 characters long
   - Application will fail to start if not properly configured
   - Never commit the actual secret to version control
   - Use different secrets for dev/staging/production

2. **ALLOWED_ORIGINS** - Only these domains can access your API
   - Default: `http://localhost:5173,http://localhost:3000`
   - Update for production domains

---

## Authentication & Authorization

### JWT Tokens

- **Algorithm**: HS256
- **Expiration**: 7 days (configurable)
- **Storage**: Client-side localStorage (consider httpOnly cookies for enhanced security)
- **Validation**: Every request checks token signature and expiration

### Password Requirements

Passwords must meet the following criteria:
- Minimum 12 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*, etc.)

### Token Blacklist System

When users log out:
1. Token is hashed (SHA-256) and stored in blacklist
2. All subsequent requests with that token are rejected
3. Expired tokens are automatically cleaned up every hour

### Endpoints

- `POST /api/auth/register` - Create new account (rate limited to 5/15min)
- `POST /api/auth/login` - Authenticate user (rate limited to 5/15min)
- `POST /api/auth/logout` - Invalidate token (requires authentication)

---

## Input Validation & Sanitization

### Validation with Zod

All endpoints use Zod schemas for type-safe input validation:
- Email format validation
- Required fields checking
- Type coercion and transformation
- Custom validation rules

### Sanitization

Automatic sanitization of all text inputs:
- **HTML/Script Removal**: All HTML tags and scripts are stripped
- **URL Validation**: Only `http://` and `https://` URLs allowed
- **Dangerous Protocols Blocked**: `javascript:`, `data:`, `vbscript:`, `file:`
- **XSS Prevention**: DOMPurify sanitizes all user-generated content

Sanitization is applied automatically via middleware to:
- Request bodies
- Query parameters
- URL fields
- Text fields (notes, reasoning, descriptions)

---

## Rate Limiting

### Auth Endpoints

**Limit**: 5 requests per 15 minutes per IP

Applies to:
- `/api/auth/register`
- `/api/auth/login`

**Purpose**: Prevent brute force password attacks

### General API Endpoints

**Limit**: 100 requests per 15 minutes per IP

Applies to:
- `/api/trades/*`
- `/api/accounts/*`
- `/api/analytics/*`
- `/api/tags/*`
- `/api/import/*`
- `/api/strategies/*`

**Purpose**: Prevent API abuse and DoS attacks

---

## Security Headers

Implemented via Helmet.js:

### Content Security Policy (CSP)

```
default-src: 'self'
style-src: 'self' 'unsafe-inline'
script-src: 'self'
img-src: 'self' data: https:
```

### HTTP Strict Transport Security (HSTS)

```
max-age: 31536000 (1 year)
includeSubDomains: true
preload: true
```

### Other Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: no-referrer`

---

## Database Security

### PostgreSQL Configuration

1. **SSL/TLS**: Enabled for non-localhost connections
   - `rejectUnauthorized: true` - Verifies server certificate
   - Prevents man-in-the-middle attacks

2. **Parameterized Queries**: All queries use `$1, $2, ...` placeholders
   - Prevents SQL injection attacks

3. **Connection Pooling**: Max 20 connections
   - Prevents connection exhaustion

4. **Foreign Key Constraints**: Enforced at database level
   - Data integrity protection

5. **Check Constraints**: Validate data at insertion
   - Business rule enforcement

### Sensitive Data Handling

- **Passwords**: Never logged or exposed
- **Query Parameters**: Not logged (may contain sensitive data)
- **User Isolation**: All queries filter by `user_id`

---

## Best Practices

### For Developers

1. **Never commit secrets** to version control
   - Use `.env` files (already in `.gitignore`)
   - Use different secrets per environment

2. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update packages with known vulnerabilities

3. **Validate all user input**
   - Use Zod schemas for type safety
   - Sanitize text inputs

4. **Use HTTPS in production**
   - Never send tokens over HTTP
   - Enable HSTS headers

5. **Monitor logs** for suspicious activity
   - Failed login attempts
   - Rate limit violations
   - Unusual access patterns

### For Deployment

1. **Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong `JWT_SECRET` (32+ chars)
   - Configure `ALLOWED_ORIGINS` for your domain

2. **Database**
   - Use SSL/TLS connections
   - Regular backups
   - Strong passwords

3. **Server**
   - Keep OS and dependencies updated
   - Use firewall rules
   - Enable logging and monitoring

4. **HTTPS**
   - Use SSL/TLS certificates
   - Redirect HTTP to HTTPS
   - Enable HSTS

---

## Security Checklist

### Before Going to Production

- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Configure ALLOWED_ORIGINS for your domain
- [ ] Set NODE_ENV=production
- [ ] Enable database SSL/TLS
- [ ] Use HTTPS for all connections
- [ ] Review and update rate limits if needed
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure logging
- [ ] Regular database backups
- [ ] Security audit of custom code
- [ ] Penetration testing
- [ ] Review user permissions and access controls

### Ongoing Maintenance

- [ ] Regularly update dependencies (`npm audit fix`)
- [ ] Monitor logs for suspicious activity
- [ ] Review rate limit violations
- [ ] Check for failed authentication attempts
- [ ] Rotate JWT_SECRET periodically (invalidates all tokens)
- [ ] Review and update security policies
- [ ] Backup database regularly
- [ ] Test disaster recovery procedures

---

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security concerns to the development team
3. Provide detailed description of the vulnerability
4. Allow reasonable time for fix before public disclosure

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated**: 2024-01-24
**Version**: 1.0.0
