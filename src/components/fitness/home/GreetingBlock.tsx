import { StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type GreetingBlockProps = {
  firstName: string;
  email?: string | null;
};

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function GreetingBlock({ firstName, email }: GreetingBlockProps) {
  const greeting = greetingForHour(new Date().getHours());

  return (
    <View style={styles.copy}>
      <Text style={styles.eyebrow}>READY FOR GREATNESS</Text>
      <Text style={styles.hello}>
        {greeting}, {firstName}!
      </Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: 6,
  },
  eyebrow: {
    color: p.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  hello: {
    color: p.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  email: {
    color: p.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
