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

  const onSubmit = (data: SignupForm) => {
    console.log('Signup submitted', data.email);
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
          Join ThinkTank and start building ideas
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
              placeholder="Jane Doe"
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

        <Button
          disabled={isSubmitting}
          label={isSubmitting ? 'Creating account...' : 'Create account'}
          onPress={handleSubmit(onSubmit)}
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
