import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { googleLogin, googleSignup, signup } from '../../api/authApi';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks';
import type { AuthStackParamList } from '../../navigation/types';
import { getDeviceName, getDeviceType } from '../../services/deviceInfo';
import { signInWithGoogle } from '../../services/googleAuth';
import { extractAuthSession, getApiErrorMessage } from '../../utils/api';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;
type SignupNavigation = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export function SignupScreen() {
  const navigation = useNavigation<SignupNavigation>();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupForm) => {
    setSubmitError(null);

    try {
      const response = await signup({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      const session = extractAuthSession(response, data.email.trim().toLowerCase());

      if (session) {
        await signIn(session);
        return;
      }

      Alert.alert(
        'Account created',
        response.message ?? 'Your account was created. Please sign in.',
        [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
      );
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to create account.');
      setSubmitError(message);
    }
  };

  const onGoogleSignUp = async () => {
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

      const device = {
        idToken,
        deviceType: getDeviceType(),
        deviceName: getDeviceName(),
      };

      await googleSignup(device);
      const response = await googleLogin(device);
      const session = extractAuthSession(response, result.data.user.email);
      if (!session) {
        Alert.alert(
          'Account created',
          'Your Google account was created. Please sign in.',
          [{ text: 'Sign in', onPress: () => navigation.navigate('Login') }],
        );
        return;
      }

      await signIn(session);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Unable to sign up with Google.'));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Screen
      header={
        <View style={styles.header}>
          <ThemeToggle />
        </View>
      }
    >
      <View style={styles.hero}>
        <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Start your discipline in progress.
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="words"
              autoComplete="name"
              error={errors.name?.message}
              label="Full name"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Mohit Kumar"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
              keyboardType="email-address"
              label="Email"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="mohit@example.com"
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="none"
              autoComplete="new-password"
              error={errors.password?.message}
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Create a password"
              secureTextEntry
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="none"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              label="Confirm password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Repeat your password"
              secureTextEntry
              value={value}
            />
          )}
        />

        {submitError ? (
          <Text style={[styles.submitError, { color: colors.error }]}>{submitError}</Text>
        ) : null}

        <Button
          disabled={isSubmitting || googleLoading}
          label={isSubmitting ? 'Creating account...' : 'Create account'}
          onPress={handleSubmit(onSubmit)}
        />

        <GoogleButton
          disabled={googleLoading || isSubmitting}
          label={googleLoading ? 'Signing up...' : 'Sign up with Google'}
          onPress={() => void onGoogleSignUp()}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Already have an account?
        </Text>
        <Button
          label="Sign in"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  hero: {
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  submitError: {
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
  },
});
