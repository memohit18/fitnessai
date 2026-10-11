import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { fitnessPalette as p } from '../../constants/fitnessPalette';
import {
  checkAppVersion,
  getCurrentAppVersion,
  openStoreForUpdate,
} from '../../services/appVersion';
import type { AppVersionConfig } from '../../types/appVersion';

type VersionGateProps = {
  children: ReactNode;
};

export function VersionGate({ children }: VersionGateProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'force'>('loading');
  const [softConfig, setSoftConfig] = useState<AppVersionConfig | null>(null);
  const [forceConfig, setForceConfig] = useState<AppVersionConfig | null>(null);
  const [softVisible, setSoftVisible] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(getCurrentAppVersion());

  const runCheck = useCallback(async () => {
    setPhase('loading');
    try {
      const result = await checkAppVersion();
      setCurrentVersion(result.currentVersion);

      if (result.status === 'force') {
        setForceConfig(result.config);
        setSoftConfig(null);
        setSoftVisible(false);
        setPhase('force');
        return;
      }

      if (result.status === 'soft') {
        setForceConfig(null);
        setSoftConfig(result.config);
        setSoftVisible(true);
        setPhase('ready');
        return;
      }

      setForceConfig(null);
      setSoftConfig(null);
      setSoftVisible(false);
      setPhase('ready');
    } catch {
      // Fail open — don't brick the app if the version endpoint is down.
      setPhase('ready');
    }
  }, []);

  useEffect(() => {
    void runCheck();
  }, [runCheck]);

  const onUpdate = async (config: AppVersionConfig) => {
    const opened = await openStoreForUpdate(config);
    if (!opened) {
      Toast.show({
        type: 'info',
        text1: 'Update required',
        text2: 'Store link is not configured yet. Contact support.',
        position: 'bottom',
      });
    }
  };

  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={p.lime} size="large" />
        <Text style={styles.muted}>Checking app version…</Text>
      </View>
    );
  }

  if (phase === 'force' && forceConfig) {
    return (
      <View style={styles.center}>
        <Text style={styles.eyebrow}>Update required</Text>
        <Text style={styles.title}>
          {forceConfig.title?.trim() || 'Please update ThinkTank'}
        </Text>
        <Text style={styles.muted}>
          {forceConfig.message?.trim() ||
            `This version (${currentVersion}) is no longer supported. Update to continue.`}
        </Text>
        <Text style={styles.meta}>
          Minimum {forceConfig.minVersion}
          {forceConfig.latestVersion
            ? ` · Latest ${forceConfig.latestVersion}`
            : ''}
        </Text>
        <Pressable
          onPress={() => void onUpdate(forceConfig)}
          style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.primaryText}>Update now</Text>
        </Pressable>
        <Pressable onPress={() => void runCheck()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>I updated — check again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      {children}
      <Modal
        animationType="fade"
        transparent
        visible={softVisible && !!softConfig}
        onRequestClose={() => setSoftVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.eyebrow}>Update available</Text>
            <Text style={styles.modalTitle}>
              {softConfig?.title?.trim() || 'A newer version is ready'}
            </Text>
            <Text style={styles.muted}>
              {softConfig?.message?.trim() ||
                `You’re on ${currentVersion}. Latest is ${softConfig?.latestVersion}.`}
            </Text>
            <Pressable
              onPress={() => softConfig && void onUpdate(softConfig)}
              style={({ pressed }) => [
                styles.primaryBtn,
                { opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={styles.primaryText}>Update</Text>
            </Pressable>
            <Pressable
              onPress={() => setSoftVisible(false)}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: p.bg,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: p.lime,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: p.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  muted: {
    color: p.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  meta: {
    color: p.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: p.lime,
    borderRadius: 14,
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  primaryText: {
    color: p.onLime,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  secondaryText: {
    color: p.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: p.surface,
    borderColor: p.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    color: p.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
