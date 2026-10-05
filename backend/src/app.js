// ==============================================================================
// PulseWatch Server (app.js) - Complete Express Application Lifecycle
// ==============================================================================
// This file demonstrates the standard 5-step lifecycle of an Express backend:
// 1. Middlewares: CORS, JSON parser, Morgan logger
// 2. Routes: API endpoints for Auth and Monitors
// 3. 404 Handler: Catches any URL that doesn't exist
// 4. Error Handler: Catches any unexpected server errors
// 5. Server Bootstrap: Connects DB, syncs tables, and listens on port
// ==============================================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { sequelize } from './db.js';
import './redis.js'; // Starts Redis connection
import './queue.js'; // Starts BullMQ background worker

import authRoutes from './routes/auth.js';
import monitorRoutes from './routes/monitors.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================================================================
// 1. Global Middlewares
// ==============================================================================
// Allow our Next.js frontend to make requests to this backend
app.use(cors());

// Automatically parse incoming JSON payloads into req.body
app.use(express.json());

// Log every HTTP request to the terminal in color (e.g. GET /api/monitors 200 4ms)
app.use(morgan('dev'));

// ==============================================================================
// 2. API Routes
// ==============================================================================
// Basic health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PulseWatch Simple Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount Authentication routes (/api/auth/register, /api/auth/login, /api/auth/me)
app.use('/api/auth', authRoutes);

// Mount Monitor routes (/api/monitors, /api/monitors/:id, etc.)
app.use('/api/monitors', monitorRoutes);

// ==============================================================================
// 3. 404 Not Found Handler
// ==============================================================================
// If a request reaches this point, none of the routes above matched!
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ==============================================================================
// 4. Global Error Handler
// ==============================================================================
// Catches any unexpected errors in the app so the server doesn't crash silently
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ==============================================================================
// 5. Start Server & Sync Database
// ==============================================================================
async function startServer() {
  try {
    // Step 1: Connect to PostgreSQL and sync tables (creates them if they don't exist)
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('✅ PostgreSQL connected & tables synced');

    // Step 2: Start listening for HTTP requests
    app.listen(PORT, () => {
      console.log(`🚀 PulseWatch Server running at http://localhost:${PORT}`);
      console.log(`📡 Health check URL: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
