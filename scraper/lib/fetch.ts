import { fetch, type RequestInit } from 'undici';
import { isAllowedByRobots } from './robots';

/** Honest identification — a real contact-style UA, not a browser spoof. */
export const USER_AGENT =
  'Mozilla/5.0 (compatible; ScrapeDeck/1.0; +https://github.com/) price-monitor';

const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 4;

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class RobotsDisallowedError extends Error {
  constructor(readonly url: string) {
    super(`robots.txt disallows ${url}`);
    this.name = 'RobotsDisallowedError';
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Full jitter exponential backoff: random in [0, base * 2^attempt]. */
function backoffDelay(attempt: number): number {
  const base = 500;
  const cap = 15_000;
  const exp = Math.min(cap, base * 2 ** attempt);
  return Math.round(Math.random() * exp);
}

/** Retry on network errors, 429, and 5xx — not on 4xx (other than 429). */
function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

interface GetOptions {
  /** Skip the robots.txt gate (used by robots.ts itself to fetch the file). */
  ignoreRobots?: boolean;
  timeoutMs?: number;
  accept?: string;
}

async function rawFetch(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Polite GET → text, with robots gate, timeout, and backoff/jitter retries. */
export async function getText(
  url: string,
  opts: GetOptions = {},
): Promise<string> {
  if (!opts.ignoreRobots) {
    const allowed = await isAllowedByRobots(url, USER_AGENT);
    if (!allowed) throw new RobotsDisallowedError(url);
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await rawFetch(
        url,
        {
          headers: {
            'user-agent': USER_AGENT,
            accept: opts.accept ?? 'application/json, text/html;q=0.9, */*;q=0.8',
            'accept-language': 'en-IN,en;q=0.9',
          },
          redirect: 'follow',
        },
        timeoutMs,
      );

      if (!res.ok) {
        if (isRetryable(res.status) && attempt < MAX_RETRIES) {
          await sleep(backoffDelay(attempt));
          continue;
        }
        // Drain the body so the socket can be reused/closed cleanly.
        await res.text().catch(() => undefined);
        throw new HttpError(`HTTP ${res.status} for ${url}`, res.status, url);
      }

      return await res.text();
    } catch (err) {
      lastErr = err;
      if (err instanceof HttpError) throw err; // non-retryable status
      if (attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
        continue;
      }
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Failed to fetch ${url}: ${String(lastErr)}`);
}

/** GET → parsed JSON. Mirrors the spec's `getJson = JSON.parse(getHtml)`. */
export async function getJson<T>(url: string, opts: GetOptions = {}): Promise<T> {
  const text = await getText(url, {
    ...opts,
    accept: opts.accept ?? 'application/json',
  });
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Expected JSON from ${url} but got non-JSON (store may be password-protected or returning HTML).`,
    );
  }
}
