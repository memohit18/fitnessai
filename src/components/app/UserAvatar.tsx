import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

function getCartoonAvatarUri(email?: string | null): string {
  const seed = encodeURIComponent(email?.trim() || 'thinktank-user');
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}`;
}

interface UserAvatarProps {
  email?: string | null;
  size?: number;
}

export function UserAvatar({ email, size = 64 }: UserAvatarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: colors.primary,
          height: size,
          width: size,
        },
      ]}
    >
      <Image source={{ uri: getCartoonAvatarUri(email) }} style={styles.image} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#E8EDF5',
    borderRadius: 999,
    borderWidth: 2,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
