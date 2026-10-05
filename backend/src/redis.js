// ==============================================================================
// Redis Client (redis.js) - Super Simple ioredis Setup
// ==============================================================================
// We use a single 'ioredis' connection for BOTH caching and BullMQ!
// No complicated setup: just connect once and export.
// ==============================================================================

import Redis from 'ioredis';
import 'dotenv/config';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null // Required by BullMQ
});

redis.on('connect', () => console.log('✅ Redis connected via ioredis'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));
