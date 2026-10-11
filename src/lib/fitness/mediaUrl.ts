import { env } from '../../constants';

/** Resolve absolute or API-relative media URLs for RN Image. */
export function resolveFitnessMediaUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const base = env.apiUrl.replace(/\/$/, '');
  if (trimmed.startsWith('/')) {
    return `${base}${trimmed}`;
  }

  return `${base}/${trimmed}`;
}

export function pickMediaUrl(
  record: Record<string, unknown> | null | undefined,
  keys: string[] = [
    'imageUrl',
    'image_url',
    'photoUrl',
    'photo_url',
    'thumbnailUrl',
    'thumbnail_url',
    'gifUrl',
    'gif_url',
    'mediaUrl',
    'media_url',
    'demoUrl',
    'demo_url',
    'image',
  ],
): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return resolveFitnessMediaUrl(value);
    }
  }
  return null;
}
