import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';
import googleAuthRouter from './routes/google-auth.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import ordersRouter from './routes/orders.js';
import statsRouter from './routes/stats.js';
import usersRouter from './routes/users.js';
import passwordResetRouter from './routes/password-reset.js';
import heroSlidesRouter from './routes/hero-slides.js';
import cartRouter from './routes/cart.js';
import favoritesRouter from './routes/favorites.js';
import shippingAddressesRouter from './routes/shipping-addresses.js';
import paymentRouter from './routes/payment.js';
import pool from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { warmCaches } from './utils/dataWarmer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const resolveStaticDir = (...parts: string[]) => {
  const candidates = [
    path.join(__dirname, '..', ...parts),
    path.join(process.cwd(), 'backend', ...parts),
    path.join(process.cwd(), ...parts),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
};

// Middleware
app.use(helmet());

// CORS configuration - allow multiple origins from environment variable
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map((url) => url.trim()) || ['http://localhost:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Raw body parser for Stripe webhook (must be before express.json())
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const productsStaticDir = resolveStaticDir('public', 'produtos');
const heroSlidesStaticDir = resolveStaticDir('public', 'hero-slides');

app.use(
  '/produtos',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(productsStaticDir)
);

app.use(
  '/hero-slides',
  (_req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(heroSlidesStaticDir)
);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB health check (temporary diagnostics endpoint)
app.get('/api/health-db', async (_req, res) => {
  try {
    const [rows]: any = await pool.query('SELECT 1 as ok');
    res.json({
      status: 'ok',
      db: rows?.[0]?.ok === 1 ? 'connected' : 'unknown',
      host: process.env.DB_HOST || null,
      port: process.env.DB_PORT || null,
      ssl: process.env.DB_SSL || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message: error?.message || 'Unknown database error',
      code: error?.code || null,
      host: process.env.DB_HOST || null,
      port: process.env.DB_PORT || null,
      ssl: process.env.DB_SSL || null,
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/auth/google', googleAuthRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/password-reset', passwordResetRouter);
app.use('/api/hero-slides', heroSlidesRouter);
app.use('/api/cart', cartRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/shipping-addresses', shippingAddressesRouter);
app.use('/api/payment', paymentRouter);

// Optional: Expose cache warming endpoint for manual triggers or cron jobs
app.get('/api/admin/warm-cache', async (_req, res) => {
  try {
    const result = await warmCaches();
    if (result.success) {
      res.json({ message: 'Cache warmed successfully', ...result });
    } else if (result.cached) {
      res.json({ message: 'Cache already populated', ...result });
    } else {
      res.status(503).json({ error: 'Cache warm failed', ...result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Cache warm endpoint error', details: String(error) });
  }
});

// Error handling
app.use(errorHandler);

export default app;
