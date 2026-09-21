import type { Name } from "./types";

export function returns(history: number[], n: number) {
  if (history.length < n + 1) return 0;
  const a = history[history.length - 1 - n];
  const b = history[history.length - 1];
  if (!a) return 0;
  return b / a - 1;
}

export function pickTicker(tick: number, names: Name[]) {
  return names[tick % names.length];
}
