import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
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
    console.log('Login submitted', data.email);
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
        <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to continue to ThinkTank
        </Text>
      </View>

      <View style={styles.form}>
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
              placeholder="you@example.com"
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
              autoComplete="password"
              error={errors.password?.message}
              label="Password"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Enter your password"
              secureTextEntry
              value={value}
            />
          )}
        />

        <Button
          disabled={isSubmitting}
          label={isSubmitting ? 'Signing in...' : 'Sign in'}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          Don&apos;t have an account?
        </Text>
        <Button
          label="Sign up"
          onPress={() => navigation.navigate('Signup')}
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
