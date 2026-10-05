// ==============================================================================
// Monitor Routes (routes/monitors.js) - Super Simple with Caching & BullMQ
// ==============================================================================

import express from 'express';
import { z } from 'zod';
import { Monitor, Heartbeat } from '../db.js';
import { redis } from '../redis.js';
import { schedulePing, removePing } from '../queue.js';
import auth from '../auth.js';

const router = express.Router();

// Require login for all monitor routes
router.use(auth);

// 1. Zod schema for creating a monitor
const monitorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  url: z.string().url('Invalid URL (e.g. https://example.com)')
});

// GET /api/monitors - List monitors with Redis Cache
router.get('/', async (req, res) => {
  const cacheKey = `monitors:${req.user.id}`;

  // Step 1: Check Redis cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ cached: true, monitors: JSON.parse(cached) });
  }

  // Step 2: Cache miss -> Read from PostgreSQL
  const monitors = await Monitor.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']]
  });

  // Step 3: Save to Redis for 30 seconds
  await redis.set(cacheKey, JSON.stringify(monitors), 'EX', 30);

  res.json({ cached: false, monitors });
});

// POST /api/monitors - Create monitor & start pinging
router.post('/', async (req, res) => {
  // Validate input directly with Zod
  const validation = monitorSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.errors[0].message });
  }

  const { name, url } = validation.data;

  // 1. Create in PostgreSQL
  const monitor = await Monitor.create({
    userId: req.user.id,
    name,
    url
  });

  // 2. Clear Redis cache so new monitor shows up immediately
  await redis.del(`monitors:${req.user.id}`);

  // 3. Tell BullMQ to start repeating pings every minute
  await schedulePing(monitor);

  res.status(201).json({ message: 'Monitor created', monitor });
});

// PATCH /api/monitors/:id/toggle - Pause or resume monitoring
router.patch('/:id/toggle', async (req, res) => {
  const monitor = await Monitor.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

  // Toggle active state
  monitor.isActive = !monitor.isActive;
  await monitor.save();

  if (monitor.isActive) {
    await schedulePing(monitor); // Resume
  } else {
    await removePing(monitor.id); // Pause
  }

  // Clear cache
  await redis.del(`monitors:${req.user.id}`);

  res.json({ message: monitor.isActive ? 'Resumed' : 'Paused', isActive: monitor.isActive });
});

// DELETE /api/monitors/:id - Delete monitor
router.delete('/:id', async (req, res) => {
  const monitor = await Monitor.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });

  // Stop BullMQ job
  await removePing(monitor.id);

  // Delete from PostgreSQL
  await monitor.destroy();

  // Clear cache
  await redis.del(`monitors:${req.user.id}`);

  res.json({ message: 'Monitor deleted' });
});

// GET /api/monitors/:id/heartbeats - Ping logs for charts
router.get('/:id/heartbeats', async (req, res) => {
  const heartbeats = await Heartbeat.findAll({
    where: { monitorId: req.params.id },
    order: [['checkedAt', 'DESC']],
    limit: 50
  });

  res.json({ heartbeats });
});

export default router;
