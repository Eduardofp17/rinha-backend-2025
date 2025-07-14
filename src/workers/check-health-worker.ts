import type { ICheckHealth, IHealthProcessor } from "../domain/health-checker";
import { HttpClient } from "../adapters/http-client";
import { ENVIRONMENT } from "../config/environment";


function pingProcessor(name: 'default' | 'fallback'): Promise<IHealthProcessor> {
  const start = Date.now();
  const processor_url = name === 'default' ? ENVIRONMENT.PAYMENT_PROCESSOR_URL_DEFAULT : ENVIRONMENT.PAYMENT_PROCESSOR_URL_FALLBACK;

  const client = new HttpClient(processor_url);

  return client.get('/payments/service-health', {'Content-Type': 'application/json'})
    .then(async res => {
      const duration = Date.now() - start;
      if (!res.ok) throw new Error('Unhealthy');
      return {
        failing: false,
        minResponseTime: duration
      };
    })
    .catch(() => ({
      failing: true,
      minResponseTime: Infinity
    }));
}

export const checkHealth = async ():Promise<ICheckHealth> => {
   const [defaultHealth, fallbackHealth] = await Promise.all([
    pingProcessor("default"),
    pingProcessor("fallback")
  ]);

  const health: ICheckHealth = {
    default: defaultHealth,
    fallback: fallbackHealth
  };

  return health;
}