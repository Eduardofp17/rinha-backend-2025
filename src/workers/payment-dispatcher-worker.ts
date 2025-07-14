import type { BasePayment, IPayment } from "../domain/payment"
import { sendToFallbackPaymentProcessor } from "../processors/fallback-processor" 
import { sendToDefaultPaymentProcessor } from "../processors/default-processor";
import { redis } from "../infra/queue";
import type { ICheckHealth } from "../domain/health-checker";

export async function dispatchPayment(payment: BasePayment): Promise<IPayment | void> {
  const requestedAt = new Date().toISOString();
  const healthRaw = await redis.get("processor-health");
  const health: ICheckHealth = healthRaw ? JSON.parse(healthRaw) : {
    default: { failing: false, minResponseTime: Infinity },
    fallback: { failing: false, minResponseTime: Infinity }
  };

  let processor: 'default' | 'fallback' = 'default';

  if(health.default.failing && !health.fallback.failing) processor = 'fallback';
  else if(health.default.minResponseTime > health.fallback.minResponseTime) processor = 'fallback';

  const res = processor === 'default' ? await sendToDefaultPaymentProcessor({...payment, requestedAt}) : await sendToFallbackPaymentProcessor({...payment, requestedAt});

  if(res.status !== 200) return;

  return {
    ...payment,
    processor,
    createdAt: new Date().toISOString()
  };
}

