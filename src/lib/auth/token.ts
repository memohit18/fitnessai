export type TokenPayload = {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

function base64UrlToUtf8(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const char of padded) {
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index < 0) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const parsed = JSON.parse(base64UrlToUtf8(payload)) as TokenPayload;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function isAccessTokenValid(token: string | undefined | null) {
  if (!token) return false;
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return false;
  // Small skew so we refresh slightly before hard expiry.
  return payload.exp * 1000 > Date.now() + 5_000;
}

export function isRefreshTokenValid(token: string | undefined | null) {
  if (!token) return false;
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 > Date.now();
}
