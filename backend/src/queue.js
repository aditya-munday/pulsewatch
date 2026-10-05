// ==============================================================================
// Queue & Background Worker (queue.js) - Super Simple BullMQ
// ==============================================================================
// 1. Queue: Schedules website check jobs into Redis.
// 2. Worker: Pulls jobs from Redis, pings the website, and saves the result in DB!
// ==============================================================================

import { Queue, Worker } from 'bullmq';
import axios from 'axios';
import { redis } from './redis.js';
import { Monitor, Heartbeat } from './db.js';

// 1. Create the Queue
export const pingQueue = new Queue('pings', { connection: redis });

// 2. Helper to schedule repeating ping every 1 minute
export async function schedulePing(monitor) {
  try {
    await pingQueue.upsertJobScheduler(
      `monitor-${monitor.id}`,
      { every: 60 * 1000 }, // Repeat every 60 seconds
      {
        name: 'check-website',
        data: { monitorId: monitor.id, url: monitor.url }
      }
    );
    // Also trigger one immediate check right now
    await pingQueue.add('check-website', { monitorId: monitor.id, url: monitor.url });
  } catch (err) {
    console.error('Error scheduling ping:', err.message);
  }
}

// 3. Helper to stop repeating ping when monitor is deleted or paused
export async function removePing(monitorId) {
  try {
    await pingQueue.removeJobScheduler(`monitor-${monitorId}`);
  } catch (err) {
    console.error('Error removing ping:', err.message);
  }
}

// 4. Background Worker: Runs automatically whenever a job is ready
export const pingWorker = new Worker(
  'pings',
  async (job) => {
    const { monitorId, url } = job.data;
    const startTime = Date.now();
    let status = 'DOWN';
    let responseTime = 0;

    try {
      // Ping the website (5s timeout)
      await axios.get(url, { timeout: 5000, validateStatus: () => true });
      status = 'UP';
      responseTime = Date.now() - startTime;
    } catch (err) {
      status = 'DOWN';
      responseTime = Date.now() - startTime;
    }

    // 1. Save Heartbeat record in PostgreSQL
    await Heartbeat.create({
      monitorId,
      status,
      responseTime
    });

    // 2. Update Monitor's current status
    await Monitor.update(
      { status, lastResponseTime: responseTime },
      { where: { id: monitorId } }
    );

    // 3. Find monitor to clear user's cache so dashboard updates
    const mon = await Monitor.findByPk(monitorId);
    if (mon) {
      await redis.del(`monitors:${mon.userId}`);
    }

    console.log(`[Worker] Checked ${url} -> ${status} (${responseTime}ms)`);
  },
  { connection: redis }
);
