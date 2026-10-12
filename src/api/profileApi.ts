import { baseApi } from './baseApi';
import { getApiErrorMessage } from '../utils/api';

export type UserProfile = {
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
};

/** PATCH /profile — name/avatar, password, or both. */
export type UpdateProfilePayload = {
  name?: string;
  avatar?: string | null;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function unwrapEnvelopeData(response: unknown) {
  const record = asRecord(response);
  if (!record) return response;
  if (record.data != null) return record.data;
  return response;
}

export function normalizeUserProfile(response: unknown): UserProfile {
  const data = asRecord(unwrapEnvelopeData(response)) ?? {};

  return {
    name: readString(data.name) ?? '',
    email: readString(data.email) ?? '',
    phone: readString(data.phone),
    avatar:
      readString(data.avatar) ??
      readString(data.imageUrl) ??
      readString(data.image_url),
    role: readString(data.role) ?? 'user',
  };
}

function toPatchBody(payload: UpdateProfilePayload) {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.avatar !== undefined) body.avatar = payload.avatar;
  if (payload.phone !== undefined) body.phone = payload.phone;
  if (payload.currentPassword) body.currentPassword = payload.currentPassword;
  if (payload.newPassword) body.newPassword = payload.newPassword;
  return body;
}

export async function getProfile(): Promise<UserProfile> {
  try {
    const { data } = await baseApi.get<unknown>('/profile');
    return normalizeUserProfile(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load profile.'));
  }
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  try {
    const { data } = await baseApi.patch<unknown>(
      '/profile',
      toPatchBody(payload),
    );
    return normalizeUserProfile(data);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update profile.'));
  }
}
