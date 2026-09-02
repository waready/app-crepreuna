import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  Bell,
  FilePlus2,
  ImagePlus,
  MessageCircleMore,
  Send,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { PublicationCard } from '@/components/social/publication-card';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  PageHeader,
  Screen,
} from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { DashboardData, PaginationMeta, Publication, UploadFile } from '@/services/api-types';
import { periodLabel } from '@/utils/format';

type FeedType = '1' | '2';

export default function FeedScreen() {
  const { user, period } = useSession();
  const [feedType, setFeedType] = useState<FeedType>('1');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState<UploadFile>();
  const [file, setFile] = useState<UploadFile>();
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    void loadInitial();
    // The selected feed type defines the initial page request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedType]);

  async function loadInitial() {
    setLoading(true);
    setError('');
    try {
      const [feed, summary] = await Promise.all([
        api.social.publications(1, feedType),
        api.dashboard(),
      ]);
      setPublications(feed.data);
      setMeta(feed.meta);
      setDashboard(summary);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el foro.');
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      const [feed, summary] = await Promise.all([
        api.social.publications(1, feedType),
        api.dashboard(),
      ]);
      setPublications(feed.data);
      setMeta(feed.meta);
      setDashboard(summary);
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar el foro.');
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !meta || meta.current_page >= meta.last_page) return;
    setLoadingMore(true);
    try {
      const next = await api.social.publications(meta.current_page + 1, feedType);
      setPublications((current) => [...current, ...next.data.filter(
        (incoming) => !current.some((item) => item.id === incoming.id)
      )]);
      setMeta(next.meta);
    } finally {
      setLoadingMore(false);
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Permite el acceso a tus fotos para adjuntar una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ['images'],
      quality: 0.82,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName || `publicacion-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
      setFile(undefined);
    }
  }

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
      ],
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
      setImage(undefined);
    }
  }

  async function publish() {
    const clean = text.trim();
    if (!clean) {
      Alert.alert('Escribe un mensaje', 'La publicacion necesita texto antes de enviarse.');
      return;
    }
    setPublishing(true);
    try {
      await api.social.createPublication({ texto: clean, tipo: feedType, imagen: image, archivo: file });
      setText('');
      setImage(undefined);
      setFile(undefined);
      await refresh();
    } catch (caught) {
      Alert.alert('No se pudo publicar', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(publication: Publication) {
    const result = publication.liked
      ? await api.social.unlike(publication.id)
      : await api.social.like(publication.id);
    setPublications((current) => current.map((item) => item.id === publication.id
      ? { ...item, liked: result.liked, like: result.likes }
      : item));
  }

  async function deletePublication(id: number) {
    try {
      await api.social.deletePublication(id);
      setPublications((current) => current.filter((item) => item.id !== id));
    } catch (caught) {
      Alert.alert('No se pudo eliminar', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }

  const firstName = user?.nombres?.split(' ')[0] || user?.nombre_completo?.split(' ')[0] || 'CEPREUNA';

  return (
    <Screen contentStyle={styles.screen} scroll={false}>
      <FlatList
        ListEmptyComponent={!loading && !error ? (
          <EmptyState
            icon={MessageCircleMore}
            message={feedType === '1'
              ? 'Se el primero en compartir algo con tu comunidad del ciclo.'
              : 'Los comunicados oficiales del ciclo apareceran aqui.'}
            title={feedType === '1' ? 'Aun no hay publicaciones' : 'Sin comunicados'}
          />
        ) : null}
        ListFooterComponent={loadingMore ? (
          <ActivityIndicator color={theme.colors.accent} style={styles.footerLoader} />
        ) : <View style={styles.footerSpace} />}
        ListHeaderComponent={(
          <View>
            <PageHeader
              action={(
                <IconButton
                  accessibilityLabel="Abrir notificaciones"
                  badge={dashboard?.resumen.notificaciones_sin_leer}
                  icon={Bell}
                  onPress={() => router.push('/panel/notificaciones')}
                  tone="light"
                />
              )}
              eyebrow={user?.rol === 'docente' ? 'Campus docente' : 'Campus estudiante'}
              period={periodLabel(period)}
              subtitle="Comparte, consulta y mantente al dia con tu comunidad."
              title={`Hola, ${firstName}`}
            />

            <View style={styles.segmentWrap}>
              <FeedSegment active={feedType === '1'} label="Foro" onPress={() => setFeedType('1')} />
              <FeedSegment active={feedType === '2'} label="Comunicados" onPress={() => setFeedType('2')} />
            </View>

            <Composer
              file={file}
              image={image}
              onClearAttachment={() => {
                setImage(undefined);
                setFile(undefined);
              }}
              onPickFile={pickFile}
              onPickImage={pickImage}
              onPublish={publish}
              publishing={publishing}
              setText={setText}
              text={text}
              userName={user?.nombre_completo || 'Usuario CEPREUNA'}
            />

            {loading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={theme.colors.accent} size="large" />
                <AppText color={theme.colors.textMuted} variant="caption">Cargando publicaciones del ciclo...</AppText>
              </View>
            ) : null}
            {error ? <ErrorState message={error} onRetry={loadInitial} /> : null}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        data={loading || error ? [] : publications}
        keyExtractor={(item) => String(item.id)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        onRefresh={refresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <PublicationCard
            onDelete={item.propia ? () => deletePublication(item.id) : undefined}
            onOpen={() => router.push({ pathname: '/panel/ver-publicacion', params: { id: String(item.id) } })}
            onToggleLike={() => toggleLike(item)}
            publication={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

function FeedSegment({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && styles.pressed]}>
      <AppText color={active ? palette.paper : theme.colors.textSoft} variant="label">{label}</AppText>
    </Pressable>
  );
}

function Composer({
  text,
  setText,
  image,
  file,
  publishing,
  userName,
  onPickImage,
  onPickFile,
  onClearAttachment,
  onPublish,
}: {
  text: string;
  setText: (value: string) => void;
  image?: UploadFile;
  file?: UploadFile;
  publishing: boolean;
  userName: string;
  onPickImage: () => void;
  onPickFile: () => void;
  onClearAttachment: () => void;
  onPublish: () => void;
}) {
  return (
    <Card style={styles.composer}>
      <View style={styles.composerTitleRow}>
        <View style={styles.composerSpark}>
          <Sparkles color={theme.colors.accent} size={19} />
        </View>
        <View style={styles.composerCopy}>
          <AppText variant="label">Comparte con tu ciclo</AppText>
          <AppText color={theme.colors.textMuted} variant="micro">Publicaras como {userName}</AppText>
        </View>
      </View>
      <Field
        maxLength={10000}
        multiline
        onChangeText={setText}
        placeholder="Escribe una consulta, aviso o aporte..."
        value={text}
      />
      {image ? (
        <View style={styles.attachmentPreview}>
          <Image contentFit="cover" source={{ uri: image.uri }} style={styles.attachmentImage} />
          <Pressable onPress={onClearAttachment} style={styles.clearAttachment}>
            <X color={palette.paper} size={16} />
          </Pressable>
        </View>
      ) : null}
      {file ? (
        <View style={styles.filePreview}>
          <FilePlus2 color={theme.colors.primary} size={20} />
          <AppText numberOfLines={1} style={styles.fileName} variant="caption">{file.name}</AppText>
          <IconButton accessibilityLabel="Quitar archivo" icon={X} onPress={onClearAttachment} tone="danger" />
        </View>
      ) : null}
      <View style={styles.composerActions}>
        <View style={styles.attachmentActions}>
          <IconButton accessibilityLabel="Adjuntar imagen" icon={ImagePlus} onPress={onPickImage} />
          <IconButton accessibilityLabel="Adjuntar documento" icon={FilePlus2} onPress={onPickFile} />
        </View>
        <Button
          compact
          disabled={!text.trim() || publishing}
          icon={Send}
          label={publishing ? 'Publicando' : 'Publicar'}
          loading={publishing}
          onPress={onPublish}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listContent: { flexGrow: 1 },
  segmentWrap: { alignSelf: 'center', backgroundColor: '#E5EDF0', borderRadius: 15, flexDirection: 'row', gap: 4, marginBottom: 16, padding: 4, width: '70%' },
  segment: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 12 },
  segmentActive: { backgroundColor: theme.colors.primary },
  composer: { gap: 14, marginBottom: 20 },
  composerTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  composerSpark: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  composerCopy: { flex: 1 },
  composerActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  attachmentActions: { flexDirection: 'row', gap: 8 },
  attachmentPreview: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  attachmentImage: { aspectRatio: 1.9, width: '100%' },
  clearAttachment: { alignItems: 'center', backgroundColor: palette.scrim, borderRadius: 16, height: 32, justifyContent: 'center', position: 'absolute', right: 9, top: 9, width: 32 },
  filePreview: { alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: 14, flexDirection: 'row', gap: 10, padding: 9 },
  fileName: { flex: 1 },
  loadingBlock: { alignItems: 'center', gap: 10, padding: 42 },
  footerLoader: { marginVertical: 24 },
  footerSpace: { height: 100 },
  pressed: { opacity: 0.72 },
});
