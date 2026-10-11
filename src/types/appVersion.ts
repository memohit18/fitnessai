export type AppVersionConfig = {
  /** Below this → hard block until user updates. */
  minVersion: string;
  /** Below this (but >= min) → dismissible update prompt. */
  latestVersion: string;
  title?: string | null;
  message?: string | null;
  storeUrlIos?: string | null;
  storeUrlAndroid?: string | null;
};

export type VersionCheckResult =
  | { status: 'ok'; currentVersion: string; config: AppVersionConfig | null }
  | {
      status: 'force' | 'soft';
      currentVersion: string;
      config: AppVersionConfig;
    };
