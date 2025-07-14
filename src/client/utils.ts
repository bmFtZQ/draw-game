export function getColor(col: number): string {
  return [
    '#fff',
    '#000',
    '#f00',
    '#ff0',
    '#0f0',
    '#0ff',
    '#00f',
    '#f0f',
    '#aaa',
    '#444',
    '#800',
    '#f80',
    '#080',
    '#088',
    '#008',
    '#808',
  ][col];
}

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(min, num), max);
}

export function localGet<T>(key: string, def: T): T;
export function localGet<T>(key: string): T | undefined;
  export function localGet<T>(key: string, _def?: T): T | undefined {
  const item = localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return _def;
}

export function localSet<T>(key: string, value: T) {
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
}
