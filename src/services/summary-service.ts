import type { IPayment } from '../domain/payment';
import { redis } from '../infra/queue';

const PAYMENTS_KEY = 'payments-processed';

export async function addPayment(payment: IPayment) {
  await redis.rpush(PAYMENTS_KEY, JSON.stringify(payment));
}

export async function getSummary(from?: string, to?: string) {
  const rawPayments = await redis.lrange(PAYMENTS_KEY, 0, -1);
  const payments: IPayment[] = rawPayments.map((p) => JSON.parse(p));

  const fromDate = from ? new Date(from) : new Date('1970-01-01T00:00:00.000Z');
  const toDate = to ? new Date(to) : new Date('9999-12-31T23:59:59.999Z');

  const filtered = payments.filter((p) => {
    const created = new Date(p.createdAt);
    return created >= fromDate && created <= toDate;
  });

  const summary: Record<'default' | 'fallback', { totalRequests: number; totalAmount: number }> = {
    default: { totalRequests: 0, totalAmount: 0 },
    fallback: { totalRequests: 0, totalAmount: 0 }
  };

  for (const p of filtered) {
    const target = summary[p.processor];
    target.totalRequests += 1;
    target.totalAmount += p.amount;
  }

  return summary;
}
