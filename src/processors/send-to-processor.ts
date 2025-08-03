import { HttpClient } from '../adapters/http-client'
import { IPayload } from '../domain/payment'
import { safeDollar } from '../utils/safe-dollar';

export async function sendToProcessor(payload: IPayload, process_url: string) {
  const client = new HttpClient(process_url, {timeout: 2500})

  try {
    const response = await client.post(
      '/payments',
      {...payload, amount: safeDollar(payload.amount)}
    )
    return response;

  } catch (err: any) {

    return {
      ok: false,
      status: err.name === 'AbortError' ? 504 : 500,
      message: err.message,
    }
  }
}
