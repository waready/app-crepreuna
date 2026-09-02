import { Image, type ImageStyle } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, type StyleProp, View } from 'react-native';

import { theme } from '@/constants/theme';
import { authenticatedImageSource } from '@/services/files';

export function AuthenticatedMedia({
  url,
  style,
  contentFit = 'cover',
}: {
  url?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
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

  if (!source || failed) {
    return (
      <View style={[styles.placeholder, style]}>
        {!failed ? <ActivityIndicator color={theme.colors.accent} /> : null}
      </View>
    );
  }

  return (
    <Image
      contentFit={contentFit}
      onError={() => setFailed(true)}
      source={source}
      style={style}
      transition={180}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    justifyContent: 'center',
  },
});
