import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import { validateSecurityConfig } from './config/security.js';
import { sanitizeRequestBody } from './middleware/sanitize.js';
import { startCleanupTasks } from './utils/cleanup.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.js';
import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import tagsRoutes from './routes/tags.js';
import importRoutes from './routes/import.js';
import accountsRoutes from './routes/accounts.js';
import strategiesRoutes from './routes/strategies.js';
import extractRoutes from './routes/extract.js';

dotenv.config();

// Validate security configuration on startup
validateSecurityConfig();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy in production (Railway/Render/etc.) so rate limiting reads X-Forwarded-For correctly
const trustProxyEnv = (process.env.TRUST_PROXY ?? '').trim().toLowerCase();
if (trustProxyEnv) {
  if (trustProxyEnv === 'true') {
    app.set('trust proxy', 1);
  } else if (trustProxyEnv === 'false') {
    app.set('trust proxy', false);
  } else {
    app.set('trust proxy', trustProxyEnv);
  }
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware - helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS Configuration - Secure origin whitelist
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

const rawAllowedOrigins: string[] = [];

if (process.env.ALLOWED_ORIGINS) {
  rawAllowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
}

// FRONTEND_URL is already required for OAuth redirects; use it as an allowed origin too.
if (process.env.FRONTEND_URL) {
  rawAllowedOrigins.push(process.env.FRONTEND_URL);
}

// Local development fallbacks
if (process.env.NODE_ENV !== 'production') {
  rawAllowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

const allowedOrigins = new Set(
  rawAllowedOrigins
    .map(normalizeOrigin)
    .filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Electron, curl)
    if (!origin || origin === 'null') return callback(null, true);

    // Check if origin is in whitelist
    if (allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }

    // Reject all other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting for all API requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware (must be after body parsers)
app.use(sanitizeRequestBody);

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply rate limiters
app.use('/api/auth', authLimiter); // Strict rate limiting for auth
app.use('/api', generalLimiter); // General rate limiting for all other API routes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/import', importRoutes);
app.use('/api/strategies', strategiesRoutes);
app.use('/api/extract', extractRoutes);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Trading Journal API ready`);

  // Start periodic cleanup tasks
  startCleanupTasks();
});
