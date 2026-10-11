import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '../../app/UserAvatar';
import { fitnessPalette as p } from '../../../constants/fitnessPalette';

type HomeHeaderProps = {
  email?: string | null;
  onAvatarPress?: () => void;
};

export function HomeHeader({ email, onAvatarPress }: HomeHeaderProps) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.brand}>THINKTANK</Text>
        <Text style={styles.title}>Home</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onAvatarPress}>
        <UserAvatar email={email} size={40} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    color: p.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: p.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 2,
  },
});
