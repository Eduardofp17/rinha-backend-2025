import type { ICheckHealth, IHealthProcessor } from '../domain/health-checker';
import { HttpClient } from '../adapters/http-client';
import { ENVIRONMENT } from '../config/environment';

async function pingProcessor(name: 'default' | 'fallback'): Promise<IHealthProcessor> {
  const start = Date.now();
  const processor_url = name === 'default' ? ENVIRONMENT.PAYMENT_PROCESSOR_URL_DEFAULT : ENVIRONMENT.PAYMENT_PROCESSOR_URL_FALLBACK;

  const client = new HttpClient(processor_url, { timeout: 1000 });

  try {
    const res = await client.get('/payments/service-health', { 'Content-Type': 'application/json' });
    const duration = Date.now() - start;
    if (!res.ok) throw new Error('Unhealthy');
    return {
      failing: false,
      minResponseTime: duration,
    };
  } catch {
    return {
      failing: true,
      minResponseTime: Infinity,
    };
  }
}

export const checkHealth = async (): Promise<ICheckHealth> => {
  const [defaultHealth, fallbackHealth] = await Promise.all([
    pingProcessor('default'),
    pingProcessor('fallback'),
  ]);

  return {
    default: defaultHealth,
    fallback: fallbackHealth,
  };
}