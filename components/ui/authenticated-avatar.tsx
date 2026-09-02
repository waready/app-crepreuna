import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { authenticatedImageSource } from '@/services/files';

export function AuthenticatedAvatar({
  name,
  url,
  size = 46,
  accent = theme.colors.accent,
}: {
  name: string;
  url?: string | null;
  size?: number;
  accent?: string;
}) {
  const [source, setSource] = useState<{ uri: string; headers: Record<string, string> }>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    authenticatedImageSource(url).then((next) => {
      if (active) setSource(next);
    });
    return () => {
      active = false;
    };
  }, [url]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'CP';

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: `${accent}1A`,
          borderColor: `${accent}42`,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}>
      {source && !failed ? (
        <Image
          contentFit="cover"
          onError={() => setFailed(true)}
          source={source}
          style={{ borderRadius: size / 2, height: size, width: size }}
          transition={180}
        />
      ) : (
        <AppText
          color={accent === palette.paper ? theme.colors.primary : accent}
          style={{ fontSize: Math.max(11, size * 0.28) }}
          variant="label">
          {initials}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
