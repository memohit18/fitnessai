/** Compare dotted versions: -1 if a<b, 0 if equal, 1 if a>b. */
export function compareSemver(a: string, b: string): number {
  const left = a
    .trim()
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10));
  const right = b
    .trim()
    .replace(/^v/i, '')
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10));

  const len = Math.max(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const l = Number.isFinite(left[i]) ? left[i] : 0;
    const r = Number.isFinite(right[i]) ? right[i] : 0;
    if (l < r) return -1;
    if (l > r) return 1;
  }
  return 0;
}

export function isVersionBelow(current: string, target: string) {
  if (!current?.trim() || !target?.trim()) return false;
  return compareSemver(current, target) < 0;
}
