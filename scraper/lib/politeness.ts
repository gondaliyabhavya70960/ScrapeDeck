import pLimit from 'p-limit';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Limiter {
  <T>(fn: () => Promise<T>): Promise<T>;
}

/**
 * Per-source politeness wrapper: caps concurrency AND enforces a minimum delay
 * between the *start* of successive requests, so even a single-concurrency
 * source paces itself. Each source gets its own limiter instance.
 */
export function createLimiter(
  concurrency = 2,
  minDelayMs = 400,
): Limiter {
  const limit = pLimit(concurrency);
  let lastStart = 0;

  return <T>(fn: () => Promise<T>): Promise<T> =>
    limit(async () => {
      const now = Date.now();
      const wait = lastStart + minDelayMs - now;
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();
      return fn();
    });
}
