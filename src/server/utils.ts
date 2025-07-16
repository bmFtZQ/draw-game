export function setTimeoutWithAbort<T extends (...args: any) => any>(signal: AbortSignal, func: T, ms: number, ...args: Parameters<T>) {
  const timeout = setTimeout(func, ms, ...args);
  signal?.addEventListener('abort', () => clearTimeout(timeout));
}

export function setIntervalWithAbort<T extends (...args: any) => any>(signal: AbortSignal, callback: T, timeout: number, ...args: Parameters<T>) {
  const interval = setInterval(callback, timeout, ...args);
  signal?.addEventListener('abort', () => clearInterval(interval));
}

export async function delay(ms: number, signal?: AbortSignal) {
  return await new Promise<void>(r => {
    const timeout = setTimeout(r, ms);
    signal?.addEventListener('abort', () => clearTimeout(timeout));
  });
}

export function round(n: number, amount: number): number {
  return Math.round(n / amount) * amount;
}

export function arrayCount<T>(arr: T[], predicate: (value: T, index: number, array: T[]) => boolean) {
  return arr.filter(predicate).length;
}

export function* mapIter<T, TOut>(iter: Iterable<T>, fn: (value: T, index: number) => TOut): Iterable<TOut> {
  let index = 0;
  for (const value of iter) {
    yield fn(value, index);
  }
}
