import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import tradesRoutes from './routes/trades.js';
import analyticsRoutes from './routes/analytics.js';
import tagsRoutes from './routes/tags.js';
import importRoutes from './routes/import.js';
import accountsRoutes from './routes/accounts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow any localhost origin
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    callback(null, true); // Allow all origins in development
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/trades', tradesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/import', importRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Trading Journal API ready`);
});
