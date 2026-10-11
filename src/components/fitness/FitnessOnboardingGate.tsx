import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getFitnessProfile } from '../../api/fitnessApi';
import { fitnessPalette as p } from '../../constants/fitnessPalette';
import { useAppDispatch } from '../../hooks';
import { hasCompletedFitnessOnboarding } from '../../lib/fitness/fitnessResponse';
import type { AppStackParamList } from '../../navigation/types';
import { getValidAccessToken } from '../../services/tokenRefresh';
import { signOut } from '../../store/slices/authSlice';
import { getApiErrorMessage } from '../../utils/api';

type GateNavigation = NativeStackNavigationProp<AppStackParamList>;

type FitnessOnboardingGateProps = {
  children: ReactNode;
};

/**
 * Mirrors desktop FitnessOnboardingGate:
 * incomplete / missing profile → FitnessSetup.
 * Mounted once around the tab navigator so tab screens stay cached.
 */
export function FitnessOnboardingGate({ children }: FitnessOnboardingGateProps) {
  const navigation = useNavigation<GateNavigation>();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const check = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setSessionExpired(false);
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setSessionExpired(true);
        setError('Your session expired. Please sign in again.');
        setStatus('error');
        return;
      }

      const profile = await getFitnessProfile();
      if (!hasCompletedFitnessOnboarding(profile)) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'FitnessSetup' }],
        });
        return;
      }
      setStatus('ready');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Unable to check fitness profile.');
      const expired = /access token expired|unauthorized|jwt expired|token expired/i.test(
        message,
      );
      setSessionExpired(expired);
      setError(
        expired ? 'Your session expired. Please sign in again.' : message,
      );
      setStatus('error');
    }
  }, [navigation]);

  useEffect(() => {
    void check();
  }, [check]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={p.lime} size="large" />
        <Text style={styles.muted}>Checking your fitness profile…</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          {sessionExpired ? 'Session expired' : 'Couldn’t verify profile'}
        </Text>
        <Text style={styles.muted}>{error}</Text>
        <Pressable
          onPress={() => {
            if (sessionExpired) {
              void dispatch(signOut());
              return;
            }
            void check();
          }}
          style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.9 : 1 }]}
        >
          <Text style={styles.btnText}>
            {sessionExpired ? 'Sign in again' : 'Retry'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: p.bg,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: p.text,
    fontSize: 18,
    fontWeight: '800',
  },
  muted: {
    color: p.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: p.lime,
    borderRadius: 14,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  btnText: {
    color: p.onLime,
    fontSize: 14,
    fontWeight: '800',
  },
});
