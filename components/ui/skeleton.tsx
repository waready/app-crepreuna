import { StyleSheet, View } from 'react-native';

type SkeletonProps = {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
  style?: object;
};

export function Skeleton({ height = 16, width = '100%', radius = 8, style }: SkeletonProps) {
  return <View style={[styles.skeleton, { height, width, borderRadius: radius }, style]} />;
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Skeleton height={44} width={44} radius={8} />
        <Skeleton height={18} width="28%" />
      </View>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} height={index === 0 ? 18 : 12} width={index === 0 ? '72%' : '92%'} />
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} rows={2} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#dfeaf1',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
