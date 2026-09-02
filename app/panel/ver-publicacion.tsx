import { useLocalSearchParams } from 'expo-router';
import { MessageCircle, Send } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { PublicationCard } from '@/components/social/publication-card';
import { AuthenticatedAvatar } from '@/components/ui/authenticated-avatar';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { Comment, Publication } from '@/services/api-types';
import { periodLabel, relativeTime } from '@/utils/format';

export default function PublicationDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Number(params.id);
  const { period } = useSession();
  const [publication, setPublication] = useState<Publication>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
    // Reload only when navigation selects another publication.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    if (!Number.isFinite(id) || id <= 0) {
      setError('La publicacion solicitada no es valida.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [post, replies] = await Promise.all([
        api.social.publication(id),
        api.social.comments(id),
      ]);
      setPublication(post);
      setComments(replies);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo abrir la publicacion.');
    } finally {
      setLoading(false);
    }
  }

  async function sendComment() {
    const clean = message.trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      await api.social.addComment(id, clean);
      setMessage('');
      const [post, replies] = await Promise.all([
        api.social.publication(id),
        api.social.comments(id),
      ]);
      setPublication(post);
      setComments(replies);
    } catch (caught) {
      Alert.alert('No se pudo comentar', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    } finally {
      setSending(false);
    }
  }

  async function toggleLike() {
    if (!publication) return;
    const result = publication.liked
      ? await api.social.unlike(publication.id)
      : await api.social.like(publication.id);
    setPublication({ ...publication, liked: result.liked, like: result.likes });
  }

  return (
    <Screen contentStyle={styles.screen} scroll={false}>
      <PageHeader
        back
        compact
        eyebrow="Conversacion"
        period={periodLabel(period)}
        subtitle="Participa con respeto y mantente dentro del tema."
        title="Publicacion"
      />
      {loading ? <LoadingState label="Abriendo conversacion..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && publication ? (
        <FlatList
          ListEmptyComponent={(
            <EmptyState
              icon={MessageCircle}
              message="Inicia la conversacion con una respuesta util."
              title="Todavia no hay comentarios"
            />
          )}
          ListFooterComponent={(
            <Card style={styles.composer}>
              <Field
                maxLength={5000}
                multiline
                onChangeText={setMessage}
                placeholder="Escribe un comentario..."
                value={message}
              />
              <Button
                disabled={!message.trim() || sending}
                fullWidth
                icon={Send}
                label={sending ? 'Enviando...' : 'Comentar'}
                loading={sending}
                onPress={sendComment}
              />
            </Card>
          )}
          ListHeaderComponent={(
            <View>
              <PublicationCard
                onOpen={() => undefined}
                onToggleLike={toggleLike}
                publication={publication}
              />
              <SectionTitle
                subtitle={`${comments.length} ${comments.length === 1 ? 'respuesta' : 'respuestas'}`}
                title="Conversacion"
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          data={comments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CommentCard comment={item} />}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
    </Screen>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  return (
    <Card style={styles.comment}>
      <AuthenticatedAvatar name={comment.autor.nombre} size={40} url={comment.autor.foto_url} />
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <AppText numberOfLines={1} style={styles.commentName} variant="label">{comment.autor.nombre}</AppText>
          <AppText color={theme.colors.textMuted} variant="micro">{relativeTime(comment.created_at)}</AppText>
        </View>
        <AppText color={theme.colors.textSoft} variant="body">{comment.descripcion}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listContent: { paddingBottom: 105 },
  comment: { alignItems: 'flex-start', flexDirection: 'row', gap: 11, marginBottom: 10, padding: 13 },
  commentBody: { flex: 1, gap: 6 },
  commentMeta: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  commentName: { flex: 1 },
  composer: { gap: 12, marginBottom: 20, marginTop: 12 },
});
