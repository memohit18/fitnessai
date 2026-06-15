import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AuthBackground } from '../../components/auth/AuthBackground';
import { AuthInput, PasswordInput } from '../../components/auth/AuthInput';
import { Checkbox } from '../../components/auth/Checkbox';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { GradientButton } from '../../components/auth/GradientButton';
import { Logo } from '../../components/auth/Logo';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { signInWithGoogle } from '../../services/googleAuth';
import type { AuthStackParamList } from '../../types/navigation';

const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginNavigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavigation>();
  const { colors } = useTheme();
  const [rememberMe, setRememberMe] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const onSubmit = (data: LoginForm) => {
    console.log('Login submitted', data.email, { rememberMe });
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);

    if (result.success) {
      console.log('Google sign in success', {
        email: result.data.user.email,
        idToken: result.data.idToken,
      });
      return;
    }

    if (!result.cancelled) {
      Alert.alert('Google Sign-In', result.message);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AuthBackground />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <ThemeToggle />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <Logo />

              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Sign in to access your secure workspace.
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

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Don&apos;t have an account?{' '}
                </Text>
                <Pressable onPress={() => navigation.navigate('Signup')}>
                  <Text style={[styles.footerLink, { color: colors.accent }]}>Sign Up</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 8,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
    textAlign: 'center',
  },
  form: {
    gap: 18,
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
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
