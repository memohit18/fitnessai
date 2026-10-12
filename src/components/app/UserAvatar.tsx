import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

function getCartoonAvatarUri(email?: string | null): string {
  const seed = encodeURIComponent(email?.trim() || 'fitnessai-user');
  return `https://api.dicebear.com/7.x/adventurer/png?seed=${seed}`;
}

interface UserAvatarProps {
  email?: string | null;
  avatar?: string | null;
  size?: number;
}

export function UserAvatar({ email, avatar, size = 64 }: UserAvatarProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const remote = avatar?.trim() && !failed ? avatar.trim() : null;

  useEffect(() => {
    setFailed(false);
  }, [avatar]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderColor: colors.primary,
          backgroundColor: colors.primary,
          height: size,
          width: size,
        },
      ]}
    >
      <Image
        key={remote ?? 'fallback'}
        source={{ uri: remote ?? getCartoonAvatarUri(email) }}
        style={styles.image}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1A1A1A',
    borderRadius: 999,
    borderWidth: 2,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});
