import {
  isFitnessErrorEnvelope,
  unwrapFitnessData,
} from '../fitness/fitnessResponse';

export type ImageVariantFormat = {
  webp: string;
  jpeg: string;
  avif: string;
  width: number;
  height: number;
  bytes: number;
};

export type ImageVariants = {
  original: ImageVariantFormat;
  thumbnail: ImageVariantFormat;
  small: ImageVariantFormat;
  medium: ImageVariantFormat;
  large: ImageVariantFormat;
};

export type UserImage = {
  id: string;
  type: string;
  images: ImageVariants;
};

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapVariant(raw: unknown): ImageVariantFormat | null {
  const record = asRecord(raw);
  if (!record) return null;
  const webp = readString(record.webp);
  const jpeg = readString(record.jpeg);
  const avif = readString(record.avif);
  if (!webp && !jpeg && !avif) return null;
  return {
    webp,
    jpeg,
    avif,
    width: readNumber(record.width),
    height: readNumber(record.height),
    bytes: readNumber(record.bytes),
  };
}

function unwrapVariants(raw: unknown): ImageVariants | null {
  const record = asRecord(raw);
  if (!record) return null;
  const original = unwrapVariant(record.original);
  const thumbnail = unwrapVariant(record.thumbnail);
  const small = unwrapVariant(record.small);
  const medium = unwrapVariant(record.medium);
  const large = unwrapVariant(record.large);
  if (!original || !thumbnail || !small || !medium || !large) return null;
  return { original, thumbnail, small, medium, large };
}

export function unwrapUserImage(raw: unknown): UserImage | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = readString(record.id);
  const variants = unwrapVariants(record.images);
  if (!id || !variants) return null;
  return {
    id,
    type: readString(record.type, 'gallery'),
    images: variants,
  };
}

export function unwrapUploadedUserImage(response: unknown): UserImage | null {
  if (isFitnessErrorEnvelope(response)) return null;
  const data = unwrapFitnessData(response);
  if (!data) return null;
  const record = asRecord(data);
  if (record?.images) return unwrapUserImage(data);
  if (record?.item) return unwrapUserImage(record.item);
  return unwrapUserImage(data);
}

export function getPreferredImageUrl(image: UserImage): string | null {
  const medium = image.images.medium;
  return (
    medium.webp ||
    medium.jpeg ||
    medium.avif ||
    image.images.large.webp ||
    image.images.large.jpeg ||
    image.images.small.webp ||
    image.images.thumbnail.jpeg ||
    null
  );
}

export function makeIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
