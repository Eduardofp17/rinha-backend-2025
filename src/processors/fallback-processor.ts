import { HttpClient } from '../adapters/http-client';
import { IPayload } from '../domain/payment';
import { ENVIRONMENT } from '../config/environment';

export async function sendToFallbackPaymentProcessor(payload: IPayload) {
 const client = new HttpClient(ENVIRONMENT.PAYMENT_PROCESSOR_URL_FALLBACK)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1500)
  const startTime = performance.now()

  try {
    const response = await client.post(
      '/payments',
      {
        'Content-Type': 'application/json',
        signal: String(controller.signal),
      },
      payload
    )

    const responseTimeMs = performance.now() - startTime
    clearTimeout(timeoutId)

    return response;

  } catch (err: any) {
    clearTimeout(timeoutId)

    const responseTimeMs = performance.now() - startTime

    return {
      ok: false,
      status: err.name === 'AbortError' ? 504 : 500,
      message: err.message,
      responseTimeMs
    }
  }
}