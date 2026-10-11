import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';

import { fetchAppVersionConfig } from '../api/appVersionApi';
import { env } from '../constants';
import { isVersionBelow } from '../lib/version/semver';
import type { AppVersionConfig, VersionCheckResult } from '../types/appVersion';

/** Installed semver from `expo.version` in app.config.js (embedded at build time). */
export function getCurrentAppVersion(): string {
  const fromConfig = Constants.expoConfig?.version?.trim();
  if (fromConfig) return fromConfig;

  return '0.0.0';
}

function configFromEnvFallback(): AppVersionConfig | null {
  const minVersion = env.minAppVersion?.trim();
  const latestVersion = env.latestAppVersion?.trim() || minVersion;
  if (!minVersion && !latestVersion) return null;

  return {
    minVersion: minVersion || latestVersion || '0.0.0',
    latestVersion: latestVersion || minVersion || '0.0.0',
    title: null,
    message: null,
    storeUrlIos: env.iosStoreUrl || null,
    storeUrlAndroid: env.androidStoreUrl || null,
  };
}

export async function checkAppVersion(): Promise<VersionCheckResult> {
  const currentVersion = getCurrentAppVersion();
  const remote = await fetchAppVersionConfig();
  const config = remote ?? configFromEnvFallback();

  if (!config) {
    return { status: 'ok', currentVersion, config: null };
  }

  const merged: AppVersionConfig = {
    ...config,
    storeUrlIos: config.storeUrlIos || env.iosStoreUrl || null,
    storeUrlAndroid: config.storeUrlAndroid || env.androidStoreUrl || null,
  };

  if (isVersionBelow(currentVersion, merged.minVersion)) {
    return { status: 'force', currentVersion, config: merged };
  }

  if (isVersionBelow(currentVersion, merged.latestVersion)) {
    return { status: 'soft', currentVersion, config: merged };
  }

  return { status: 'ok', currentVersion, config: merged };
}

export function resolveStoreUrl(config: AppVersionConfig): string | null {
  if (Platform.OS === 'ios') {
    return config.storeUrlIos || env.iosStoreUrl || null;
  }
  if (Platform.OS === 'android') {
    return config.storeUrlAndroid || env.androidStoreUrl || null;
  }
  return config.storeUrlIos || config.storeUrlAndroid || null;
}

export async function openStoreForUpdate(
  config: AppVersionConfig,
): Promise<boolean> {
  const url = resolveStoreUrl(config);
  if (!url) return false;
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
