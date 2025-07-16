import type { EnumType } from "typescript";

export const colors = [
  '#FFFFFF', '#000000',
  '#C1C1C1', '#505050',
  '#EF130B', '#740B07',
  '#FF7100', '#C23800',
  '#FFE414', '#E8A206',
  '#01CC17', '#014619',
  '#02FC91', '#01785D',
  '#00B2FF', '#01569E',
  '#2329D3', '#0D0E65',
  '#A223BA', '#550F69',
  '#DF69A7', '#873554',
  '#FFAC8E', '#CC774D',
  '#A0522D', '#63300E',
];

export const colorNames = [
  'white', 'black',
  'light grey', 'dark grey',
  'red', 'dark red',
  'orange', 'dark orange',
  'yellow', 'dark yellow',
  'green', 'dark green',
  'mint', 'dark mint',
  'blue', 'dark blue',
  'indigo', 'dark indigo',
  'purple', 'dark purple',
  'pink', 'dark pink',
  'beige', 'light brown',
  'brown', 'dark brown'
];

export function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(min, num), max);
}

export function localGet<T>(key: string, def: T): T;
export function localGet<T>(key: string): T | undefined;
export function localGet<T>(key: string, def?: T): T | undefined {
  const item = localStorage.getItem(key);
  if (item) {
    return JSON.parse(item);
  }
  return def;
}

export function localSet<T>(key: string, value: T) {
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
}

export function unhandled(value: never): never {
  throw Error(`Unhandled switch value: ${JSON.stringify(value, undefined, 2)}`);
}
