export class HttpClient {
  private base_url: string;

  constructor(base_url: string){
    this.base_url = base_url;
  }

  async get(endpoint: `/${string}`, headers: HeadersInit): Promise<Response> {
      const res = await fetch(`${this.base_url}${endpoint}`, {method: 'GET', headers});
      return res;
  }

  async post<T>(endpoint: `/${string}`, headers: HeadersInit, body: T): Promise<Response>{
    const res = await fetch(`${this.base_url}${endpoint}`, {method: 'POST', headers, body: JSON.stringify(body)})
    return res;
  }
}