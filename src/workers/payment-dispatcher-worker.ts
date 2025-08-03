import type { BasePayment, IPayment } from "../domain/payment"
import { redis } from "../infra/queue";
import type { ICheckHealth } from "../domain/health-checker";
import { sendToProcessor } from "../processors/send-to-processor";
import { ENVIRONMENT } from "../config/environment";

export async function dispatchPayment(payment: BasePayment): Promise<IPayment | void> {
  const requestedAt = new Date().toISOString();
  const healthRaw = await redis.get("processor-health");
  const health: ICheckHealth = healthRaw ? JSON.parse(healthRaw) : {
    default: { failing: false, minResponseTime: Infinity },
    fallback: { failing: false, minResponseTime: Infinity }
  };

  let processor: 'default' | 'fallback' = 'default';
  
  if (health.default.failing && !health.fallback.failing) {
    processor = 'fallback';
  } else if (health.fallback.failing && !health.default.failing) {
    processor = 'default';
  } else if (!health.default.failing && !health.fallback.failing) {
    if (health.fallback.minResponseTime < health.default.minResponseTime * 0.8) {
      processor = 'fallback';
    }
  }

  const res = processor === 'default' ? await sendToProcessor({...payment, requestedAt}, ENVIRONMENT.PAYMENT_PROCESSOR_URL_DEFAULT) : await sendToProcessor({...payment, requestedAt}, ENVIRONMENT.PAYMENT_PROCESSOR_URL_FALLBACK);

  if(res.status !== 200) return;

  return {
    ...payment,
    processor,
    createdAt: requestedAt
  };
}

