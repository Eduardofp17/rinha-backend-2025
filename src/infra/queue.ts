import {Queue, Worker, Job} from 'bullmq';
import Redis from 'ioredis';
import { ENVIRONMENT } from '../config/environment';
import type { BasePayment, IPayment } from '../domain/payment';
import { dispatchPayment } from '../workers/payment-dispatcher-worker';
import { addPayment } from '../services/summary-service';
import { checkHealth } from '../workers/check-health-worker';

export const redis = new Redis(String(ENVIRONMENT.REDIS_URL), {maxRetriesPerRequest: null});

const queue = new Queue("payments", {connection: redis});

const healthQueue = new Queue("processors-health", { connection: redis });

redis.on("connect", async () => {
  await healthQueue.add("processors-health", {}, {
    repeat: {
      every: 5000
    },
    jobId: 'check-health-job'
  });
});


const worker = new Worker("payments", async (job: Job<BasePayment>) => {
  return await dispatchPayment(job.data);
}, {connection: redis});

const checkHealthWorker = new Worker("processors-health", async (_: Job) => {
  const health = await checkHealth();

  await redis.set("processor-health", JSON.stringify(health));
}, {connection: redis});

worker.on("completed", async (job) => {
  const result = job.returnvalue;
  if (!result) return;
  
  addPayment(result);
});


export {queue};