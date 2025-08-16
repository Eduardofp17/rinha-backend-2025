import {Queue, Worker, Job} from 'bullmq';
import Redis from 'ioredis';
import { ENVIRONMENT } from '../config/environment';
import type { BasePayment } from '../domain/payment';
import { dispatchPayment } from '../workers/payment-dispatcher-worker';
import { addPayment } from '../services/summary-service';
import { checkHealth } from '../workers/check-health-worker';

export const redis = new Redis(String(ENVIRONMENT.REDIS_URL), {
  maxRetriesPerRequest: 3, 
  retryStrategy(times) {
    return Math.min(times * 50, 2000); 
  },
  enableOfflineQueue: false,
  connectionName: 'rinha-backend-2025',
});

const queue = new Queue("payments", {
  connection: redis, 
  defaultJobOptions: {
  attempts: 3, 
  backoff: {
    type: 'exponential',
    delay: 500,
  },
  },
});

const healthQueue = new Queue("processors-health", { 
  connection: redis,
    defaultJobOptions: {
    removeOnComplete: true, 
    removeOnFail: true,
  },
});

redis.on("connect", async () => {
  await healthQueue.add("processors-health", {}, {
    repeat: {
      every: 5000
    },
    jobId: 'check-health-job'
  });
});


const worker = new Worker("payments", async (job: Job<BasePayment>) => {
  try {
    const payment = await dispatchPayment(job.data);
    await redis.hset('payments-correlationIds', job.data.correlationId, 'done');

    return payment;
  } catch (error) {
    await redis.hdel('payments-correlationIds', job.data.correlationId);
  }
}, {connection: redis, concurrency: 8});

const checkHealthWorker = new Worker(
  'processors-health',
  async (_: Job) => {
    const pipeline = redis.pipeline();
    const health = await checkHealth();
    
    pipeline.set('processor-health', JSON.stringify(health));
    await pipeline.exec();
  },
  {
    connection: redis,
    concurrency: 1, 
    limiter: {
      max: 1,
      duration: 5000,
    },
  }
);

worker.on("completed", async (job) => {
  setImmediate(() => {
    const result = job.returnvalue;
    if (!result) return;
    addPayment(result);
  });
});

process.on('SIGTERM', async () => {
  await worker.close();
  await checkHealthWorker.close();
  await redis.quit();
});

export {queue};