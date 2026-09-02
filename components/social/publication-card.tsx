import {
  Download,
  FileText,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AuthenticatedAvatar } from '@/components/ui/authenticated-avatar';
import { AuthenticatedMedia } from '@/components/ui/authenticated-media';
import { AppText, Card, IconButton, Pill } from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import type { Publication } from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { relativeTime } from '@/utils/format';

export function PublicationCard({
  publication,
  onOpen,
  onToggleLike,
  onDelete,
}: {
  publication: Publication;
  onOpen: () => void;
  onToggleLike: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const [liking, setLiking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function toggleLike() {
    if (liking) return;
    setLiking(true);
    try {
      await onToggleLike();
    } finally {
      setLiking(false);
    }
  }

  async function downloadFile() {
    if (!publication.archivo_url || downloading) return;
    setDownloading(true);
    try {
      await downloadAuthenticatedFile(
        publication.archivo_url,
        `publicacion-${publication.id}`
      );
    } catch (error) {
      Alert.alert('No se pudo descargar', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setDownloading(false);
    }
  }

  function confirmDelete() {
    if (!onDelete) return;
    Alert.alert(
      'Eliminar publicacion',
      'Esta publicacion dejara de aparecer para todos los usuarios del ciclo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => void onDelete() },
      ]
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.authorRow}>
        <AuthenticatedAvatar
          name={publication.autor.nombre}
          size={46}
          url={publication.autor.foto_url}
        />
        <View style={styles.authorCopy}>
          <AppText numberOfLines={1} variant="label">{publication.autor.nombre}</AppText>
          <View style={styles.authorMeta}>
            <Pill
              label={publication.autor.rol}
              tone={publication.autor.rol.toLowerCase().includes('docente') ? 'info' : 'accent'}
            />
            <AppText color={theme.colors.textMuted} variant="micro">{relativeTime(publication.created_at)}</AppText>
          </View>
        </View>
        {publication.propia ? (
          <IconButton
            accessibilityLabel="Eliminar publicacion"
            icon={Trash2}
            onPress={confirmDelete}
            tone="danger"
          />
        ) : (
          <MoreHorizontal color={theme.colors.textMuted} size={21} />
        )}
      </View>

      <Pressable onPress={onOpen} style={styles.contentPressable}>
        <AppText style={styles.description} variant="body">{publication.descripcion}</AppText>
        {publication.imagen_url ? (
          <AuthenticatedMedia style={styles.media} url={publication.imagen_url} />
        ) : null}
      </Pressable>

      {publication.archivo_url ? (
        <Pressable
          accessibilityRole="button"
          onPress={downloadFile}
          style={({ pressed }) => [styles.fileRow, pressed && styles.pressed]}>
          <View style={styles.fileIcon}>
            <FileText color={theme.colors.primary} size={20} />
          </View>
          <View style={styles.fileCopy}>
            <AppText variant="label">Archivo adjunto</AppText>
            <AppText color={theme.colors.textMuted} variant="micro">
              {downloading ? 'Preparando descarga...' : 'Toca para descargar de forma segura'}
            </AppText>
          </View>
          <Download color={theme.colors.accent} size={19} />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={publication.liked ? 'Quitar Me gusta' : 'Dar Me gusta'}
          accessibilityRole="button"
          disabled={liking}
          onPress={toggleLike}
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
          <Heart
            color={publication.liked ? theme.colors.danger : theme.colors.textSoft}
            fill={publication.liked ? theme.colors.danger : 'transparent'}
            size={19}
            strokeWidth={2.2}
          />
          <AppText color={publication.liked ? theme.colors.danger : theme.colors.textSoft} variant="caption">
            {publication.like || 0}
          </AppText>
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [styles.actionButton, styles.commentButton, pressed && styles.pressed]}>
          <MessageCircle color={theme.colors.textSoft} size={19} strokeWidth={2.2} />
          <AppText color={theme.colors.textSoft} variant="caption">
            {publication.comments_count || 0} comentarios
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 15, marginBottom: 14, paddingBottom: 10 },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  authorCopy: { flex: 1, gap: 5 },
  authorMeta: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contentPressable: { gap: 13 },
  description: { color: theme.colors.textSoft },
  media: { aspectRatio: 1.62, backgroundColor: theme.colors.surfaceMuted, borderRadius: 17, width: '100%' },
  fileRow: { alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: 15, flexDirection: 'row', gap: 10, padding: 11 },
  fileIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  fileCopy: { flex: 1 },
  actions: { alignItems: 'center', borderTopColor: theme.colors.border, borderTopWidth: 1, flexDirection: 'row', marginHorizontal: -16, marginTop: 2, paddingHorizontal: 13, paddingTop: 8 },
  actionButton: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 38, paddingHorizontal: 10 },
  commentButton: { flex: 1 },
  actionDivider: { backgroundColor: theme.colors.border, height: 24, width: 1 },
  pressed: { opacity: 0.65 },
});
