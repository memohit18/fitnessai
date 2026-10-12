import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { googleLogin, login } from '../../api/authApi';
import { AuthInput, PasswordInput } from '../../components/auth/AuthInput';
import { Checkbox } from '../../components/auth/Checkbox';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { GradientButton } from '../../components/auth/GradientButton';
import { WavingIllustration } from '../../components/auth/WavingIllustration';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useAuth } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { signInWithGoogle } from '../../services/googleAuth';
import { getDeviceName, getDeviceType } from '../../services/deviceInfo';
import type { AuthStackParamList } from '../../navigation/types';
import { extractAuthSession, getApiErrorMessage } from '../../utils/api';

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginNavigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavigation>();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitError(null);

    try {
      const response = await login({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
      });

      const session = extractAuthSession(response, data.email.trim().toLowerCase());

      if (!session) {
        setSubmitError('Login succeeded but no access token was returned.');
        return;
      }

      await signIn(session);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to sign in.'));
    }
  };

  const onGoogleSignIn = async () => {
    setSubmitError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        if (!result.cancelled) setSubmitError(result.message);
        return;
      }

      const idToken = result.data.idToken;
      if (!idToken) {
        setSubmitError('Google did not return a sign-in token.');
        return;
      }

      const response = await googleLogin({
        idToken,
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
      });
      const session = extractAuthSession(response, result.data.user.email);
      if (!session) {
        setSubmitError('Google sign-in succeeded but no access token was returned.');
        return;
      }

      await signIn(session);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to sign in with Google.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <ThemeToggle />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.content}>
            <View style={styles.hero}>
              <View style={styles.brandBlock}>
                <Image source={require('../../../assets/icon.png')} style={styles.logo} />
                <Text style={[styles.wordmark, { color: colors.text }]}>DIP</Text>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                  Discipline in Progress
                </Text>
                <View style={[styles.track, { backgroundColor: colors.border }]}>
                  <View style={[styles.trackFill, { backgroundColor: colors.primary }]} />
                </View>
              </View>
              <WavingIllustration />
            </View>

            <View style={styles.formBlock}>
              <Text style={[styles.title, { color: colors.text }]}>Sign in</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Pick up where you left off.
              </Text>

              <View style={styles.form}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthInput
                      autoCapitalize="none"
                      autoComplete="email"
                      error={errors.email?.message}
                      keyboardType="email-address"
                      label="Email Address"
                      leftIcon="mail-outline"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="name@company.com"
                      value={value}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      autoCapitalize="none"
                      autoComplete="password"
                      error={errors.password?.message}
                      label="Password"
                      labelRight={
                        <Pressable hitSlop={8}>
                          <Text style={[styles.forgotLink, { color: colors.accent }]}>
                            Forgot Password?
                          </Text>
                        </Pressable>
                      }
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="••••••••"
                      value={value}
                    />
                  )}
                />

                <Checkbox
                  checked={rememberMe}
                  label="Remember me for 30 days"
                  onToggle={() => setRememberMe((current) => !current)}
                />

                {submitError ? (
                  <Text style={[styles.submitError, { color: colors.error }]}>{submitError}</Text>
                ) : null}

                <GradientButton
                  label="Sign In"
                  loading={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                />

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <GoogleButton
                  disabled={googleLoading}
                  label={googleLoading ? 'Signing in...' : 'Continue with Google'}
                  onPress={onGoogleSignIn}
                />
              </View>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Signup')}>
                  <Text style={[styles.footerLink, { color: colors.accent }]}>Sign Up</Text>
                </Pressable>
              </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 8,
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandBlock: {
    flex: 1,
    paddingBottom: 8,
  },
  logo: {
    borderRadius: 12,
    height: 44,
    marginBottom: 8,
    width: 44,
  },
  wordmark: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  track: {
    borderRadius: 99,
    height: 4,
    marginTop: 12,
    overflow: 'hidden',
    width: 112,
  },
  trackFill: {
    borderRadius: 99,
    height: 4,
    width: '42%',
  },
  formBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 16,
  },
  form: {
    gap: 14,
  },
  submitError: {
    fontSize: 14,
    lineHeight: 20,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
