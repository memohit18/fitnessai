import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type ChallengeBannerProps = {
  onStart?: () => void;
};

export function ChallengeBanner({ onStart }: ChallengeBannerProps) {
  return (
    <LinearGradient
      colors={[p.lime, p.limeSoft, '#2EE6A8']}
      end={{ x: 1, y: 0.5 }}
      start={{ x: 0, y: 0.5 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons color={p.text} name="trophy" size={20} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>New Challenge</Text>
        <Text style={styles.subtitle}>2 Weeks of Energy</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onStart}
        style={({ pressed }) => [styles.startBtn, { opacity: pressed ? 0.9 : 1 }]}
      >
        <Text style={styles.startText}>START</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(10,20,15,0.88)',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: p.onLime,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(10,20,15,0.72)',
    fontSize: 13,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  startText: {
    color: p.onLime,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
