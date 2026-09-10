import { Injectable } from '@nestjs/common';

export class HttpRequestError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`HTTP request to ${url} failed with status ${status}.`);
    this.name = 'HttpRequestError';
  }
}

@Injectable()
export class HttpClientService {
  public static readonly TIMEOUT_MS = 10_000;

  async getJson<T>(url: string, query: Record<string, string | number> = {}): Promise<T> {
    const target = new URL(url);

    for (const [key, value] of Object.entries(query)) {
      target.searchParams.set(key, String(value));
    }

    const response = await fetch(target, {
      signal: AbortSignal.timeout(HttpClientService.TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });

    if (!response.ok) {
      throw new HttpRequestError(target.toString(), response.status, await response.text());
    }

    return (await response.json()) as T;
  }
}
