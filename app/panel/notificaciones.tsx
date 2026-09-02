import { router } from 'expo-router';
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronRight,
  MessageCircleMore,
  RefreshCw,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { NotificationItem } from '@/services/api-types';
import { periodLabel, readableStatus, relativeTime } from '@/utils/format';

export default function NotificationsScreen() {
  const { period } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load(1);
  }, []);

  async function load(nextPage = 1, refresh = false) {
    if (nextPage > 1) setLoadingMore(true);
    else if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await api.social.notifications(nextPage);
      setItems((current) => nextPage === 1 ? response.data : [...current, ...response.data]);
      setPage(response.meta.current_page);
      setLastPage(response.meta.last_page);
      setUnread(response.meta.unread ?? response.data.filter((item) => !isRead(item.estado)).length);
      if (nextPage === 1 && response.data.length) {
        api.social.readNotifications().catch(() => undefined);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar las notificaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }

  return (
    <Screen onRefresh={() => load(1, true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow="Actividad reciente"
        period={periodLabel(period)}
        subtitle="Avisos, respuestas y novedades vinculadas a tu cuenta."
        title="Notificaciones"
      />
      <View style={styles.content}>
        <SectionTitle
          action={unread ? <Pill icon={BellRing} label={`${unread} nuevas`} tone="accent" /> : <Pill icon={CheckCheck} label="Al dia" tone="success" />}
          subtitle={`${items.length} notificaciones cargadas`}
          title="Bandeja"
        />
        {loading ? <LoadingState label="Consultando novedades..." /> : null}
        {error && !items.length ? <ErrorState message={error} onRetry={() => load(1)} /> : null}
        {!loading && !error && !items.length ? (
          <EmptyState
            icon={Bell}
            message="Cuando exista una respuesta o novedad, aparecera en esta bandeja."
            title="Todo esta al dia"
          />
        ) : null}
        {items.map((item) => (
          <NotificationCard item={item} key={item.id} />
        ))}
        {page < lastPage ? (
          <Button
            fullWidth
            icon={RefreshCw}
            label="Cargar anteriores"
            loading={loadingMore}
            onPress={() => void load(page + 1)}
            variant="secondary"
          />
        ) : null}
      </View>
    </Screen>
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const read = isRead(item.estado);
  const canOpen = Boolean(item.publicacion_id);
  return (
    <Card style={read ? styles.card : [styles.card, styles.cardUnread]}>
      <Pressable
        disabled={!canOpen}
        onPress={() => router.push({ pathname: '/panel/ver-publicacion', params: { id: String(item.publicacion_id) } })}
        style={({ pressed }) => [styles.cardPress, pressed && styles.pressed]}>
        <View style={[styles.icon, !read && styles.iconUnread]}>
          <MessageCircleMore color={read ? theme.colors.textMuted : theme.colors.accent} size={21} />
        </View>
        <View style={styles.copy}>
          <View style={styles.meta}>
            <AppText color={read ? theme.colors.textMuted : theme.colors.accent} variant="micro">
              {read ? readableStatus(item.tipo) : 'NUEVA ACTIVIDAD'}
            </AppText>
            <AppText color={theme.colors.textMuted} variant="micro">{relativeTime(item.created_at)}</AppText>
          </View>
          <AppText color={read ? theme.colors.textSoft : theme.colors.text} variant={read ? 'body' : 'label'}>
            {item.descripcion}
          </AppText>
        </View>
        {canOpen ? <ChevronRight color={theme.colors.textMuted} size={20} /> : null}
      </Pressable>
    </Card>
  );
}

function isRead(status?: string) {
  return ['1', 'leido', 'leida', 'read', 'visto'].includes(String(status || '').toLowerCase());
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingHorizontal: 16, paddingTop: 18 },
  card: { marginBottom: 0, padding: 0 },
  cardUnread: { backgroundColor: theme.colors.accentSoft, borderColor: '#A5D9EA' },
  cardPress: { alignItems: 'center', flexDirection: 'row', gap: 11, padding: 14 },
  icon: { alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  iconUnread: { backgroundColor: theme.colors.surface },
  copy: { flex: 1, gap: 5 },
  meta: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  pressed: { opacity: 0.78 },
});
