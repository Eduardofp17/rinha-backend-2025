import { request, Dispatcher } from 'undici';

const MAX_RETRIES = 2;
const PER_ATTEMPT_TIMEOUT = 1500; 
const RETRIABLE_STATUSES = [429, 502, 503, 504];

type HttpMethod = 'GET' | 'POST';

interface HttpClientOptions {
  dispatcher?: Dispatcher;
  timeout?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly options: HttpClientOptions = {}
  ) {}

  async request<T = unknown>(
    method: HttpMethod,
    endpoint: `/${string}`,
    body?: any,
    headers: HeadersInit = {}
  ): Promise<{ status: number; body: T | string; ok: boolean }> {
    const dispatcher = this.options.dispatcher;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await request(`${this.baseUrl}${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(this.options.timeout ?? PER_ATTEMPT_TIMEOUT),
          dispatcher,
        });

        const text = await res.body.text();
        const isJson = res.headers['content-type']?.includes('application/json');
        const parsed = isJson ? JSON.parse(text) : text;

        if (RETRIABLE_STATUSES.includes(res.statusCode) && attempt < MAX_RETRIES) {
          await sleep(100);
          continue;
        }

        return {
          status: res.statusCode,
          body: parsed,
          ok: res.statusCode >= 200 && res.statusCode < 300,
        };
      } catch (err: any) {
        if (attempt < MAX_RETRIES) {
          await sleep(100);
        } else {
          throw new Error(`Request to ${endpoint} failed after ${MAX_RETRIES + 1} attempts`);
        }
      }
    }

    throw new Error(`Unexpected error in retry logic`);
  }

  get<T = unknown>(endpoint: `/${string}`, headers?: HeadersInit) {
    return this.request<T>('GET', endpoint, undefined, headers);
  }

  post<T = unknown>(endpoint: `/${string}`, body: any, headers?: HeadersInit) {
    return this.request<T>('POST', endpoint, body, headers);
  }
}
