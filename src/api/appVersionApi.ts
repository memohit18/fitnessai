import axios from 'axios';

import { baseApi } from './baseApi';
import { env } from '../constants';
import type { AppVersionConfig } from '../types/appVersion';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function unwrapPayload(raw: unknown): Record<string, unknown> | null {
  const record = asRecord(raw);
  if (!record) return null;
  if (record.data && typeof record.data === 'object') {
    return asRecord(record.data);
  }
  return record;
}

export function normalizeAppVersionConfig(
  raw: unknown,
): AppVersionConfig | null {
  const data = unwrapPayload(raw);
  if (!data) return null;

  const minVersion = readString(
    data.minVersion ?? data.min_version ?? data.minimumVersion,
  );
  const latestVersion = readString(
    data.latestVersion ??
      data.latest_version ??
      data.currentVersion ??
      data.version,
  );

  if (!minVersion && !latestVersion) return null;

  return {
    minVersion: minVersion || latestVersion,
    latestVersion: latestVersion || minVersion,
    title: readString(data.title) || null,
    message: readString(data.message ?? data.description) || null,
    storeUrlIos: readString(
      data.storeUrlIos ?? data.iosStoreUrl ?? data.iosUrl,
    ) || null,
    storeUrlAndroid: readString(
      data.storeUrlAndroid ?? data.androidStoreUrl ?? data.androidUrl,
    ) || null,
  };
}

/**
 * Remote version policy for the mobile client.
 *
 * Backend contract — GET /mobile/app-version (public):
 * {
 *   minVersion: "1.0.0",      // force update if app < this
 *   latestVersion: "1.2.0",   // soft prompt if app < this
 *   title?: string,
 *   message?: string,
 *   storeUrlIos?: string,
 *   storeUrlAndroid?: string
 * }
 * Also accepts { success, data: { ... } }.
 */
export async function fetchAppVersionConfig(): Promise<AppVersionConfig | null> {
  try {
    const { data } = await baseApi.get<unknown>('/mobile/app-version', {
      timeout: Math.min(env.apiTimeoutMs, 10_000),
    });
    return normalizeAppVersionConfig(data);
  } catch (error) {
    // Auth-less public endpoint may 401 on some gateways — try without bearer.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        const { data } = await axios.get(
          `${env.apiUrl}/mobile/app-version`,
          {
            timeout: Math.min(env.apiTimeoutMs, 10_000),
            headers: { 'Content-Type': 'application/json' },
          },
        );
        return normalizeAppVersionConfig(data);
      } catch {
        return null;
      }
    }
    return null;
  }
}
