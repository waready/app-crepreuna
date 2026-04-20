import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, ImagePlus, LogOut, MessageCircle, Send, Share2, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ListSkeleton } from '@/components/ui/skeleton';
import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { normalizeRepoPosts } from '@/services/cepreuna-mappers';

type ForumPost = ReturnType<typeof normalizeRepoPosts>[number];

const fallbackPosts = [
  {
    id: '1',
    name: 'Coordinacion Academica',
    role: 'CEPREUNA',
    time: 'Hace 12 min',
    text: 'Estudiantes, los cuadernillos de la semana 03 ya se encuentran disponibles en la plataforma.',
    likes: 48,
    comments: 12,
    accent: '#006CAF',
  },
  {
    id: '2',
    name: 'Ana Luque',
    role: 'Estudiante',
    time: 'Hace 34 min',
    text: 'Alguien tiene el enlace de la clase de Biologia? No me aparece en el horario.',
    likes: 16,
    comments: 7,
    accent: '#0F7A59',
  },
  {
    id: '3',
    name: 'Prof. Miguel Ramos',
    role: 'Docente',
    time: 'Hace 1 h',
    text: 'Hoy subire una practica adicional de razonamiento matematico. Revisen el modulo de cursos.',
    likes: 31,
    comments: 5,
    accent: '#BF211E',
  },
];

export default function ForumScreen() {
  const [draft, setDraft] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadPosts = useCallback(() => api.getPublicaciones(1, 1), []);
  const { data, loading, error, refresh } = useApiResource(loadPosts);

  useEffect(() => {
    if (!data) {
      return;
    }
    const nextPosts = normalizeRepoPosts(data);
    const pagination = getPublicationPagination(data);
    setPosts(nextPosts);
    setPage(pagination.currentPage);
    setHasNextPage(pagination.hasNextPage);
  }, [data]);

  const visiblePosts = posts.length ? posts : (!loading ? fallbackPosts : []);
  const canLoadMore = posts.length > 0 && hasNextPage && !loading && !loadingMore;

  const refreshFeed = useCallback(async () => {
    setPage(1);
    setHasNextPage(true);
    await refresh();
  }, [refresh]);

  const loadMorePosts = useCallback(async () => {
    if (!canLoadMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await api.getPublicaciones(nextPage, 1);
      const nextPosts = normalizeRepoPosts(response);
      const pagination = getPublicationPagination(response);
      setPosts((current) => mergePosts(current, nextPosts));
      setPage(pagination.currentPage || nextPage);
      setHasNextPage(pagination.hasNextPage);
    } catch (error) {
      if (!(error instanceof Error && error.message === 'SESSION_EXPIRED_REDIRECT')) {
        console.warn(error);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [canLoadMore, page]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      router.replace('/');
    }
  };

  const handlePublish = async () => {
    if (!draft.trim() || publishing) {
      return;
    }
    setPublishing(true);
    try {
      await api.crearPublicacion({ usuario: 'Estudiante CEPREUNA', texto: draft.trim(), tipo: 1 });
      setDraft('');
      await refreshFeed();
    } catch (error) {
      if (!(error instanceof Error && error.message === 'SESSION_EXPIRED_REDIRECT')) {
        console.warn(error);
      }
    } finally {
      setPublishing(false);
    }
  };

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Foro institucional</Text>
          <Text style={styles.title}>Publicaciones</Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#ffffff" size={19} />
        </Pressable>
      </View>

      <View style={styles.composer}>
        <View style={styles.composerTop}>
          <View style={styles.avatar}>
            <Image source={require('@/assets/images/cepreuna-logo.png')} style={styles.avatarLogo} contentFit="contain" />
          </View>
          <View style={styles.composerInputWrap}>
            <Text style={styles.composerName}>Estudiante CEPREUNA</Text>
            <TextInput
              multiline
              placeholder="Que estas pensando?"
              placeholderTextColor="#8a99a6"
              style={styles.composerInput}
              value={draft}
              onChangeText={setDraft}
            />
          </View>
        </View>
        <View style={styles.composerActions}>
          <View style={styles.attachButton}>
            <ImagePlus color="#006CAF" size={19} />
            <Text style={styles.attachText}>Adjuntar</Text>
          </View>
          <Pressable style={[styles.postButton, publishing && styles.postButtonDisabled]} onPress={handlePublish} disabled={publishing}>
            <Send color="#ffffff" size={18} />
            <Text style={styles.postButtonText}>{publishing ? 'Publicando...' : 'Publicar'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.feedHeader}>
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
        <Pressable onPress={refreshFeed}>
          <Text style={styles.sectionAction}>{loading ? 'Cargando...' : 'Actualizar'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}
      {loading && !posts.length ? <ListSkeleton count={3} /> : null}
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return <ListSkeleton count={2} />;
    }
    if (posts.length && !hasNextPage) {
      return <Text style={styles.endText}>Ya llegaste al inicio del historial.</Text>;
    }
    return null;
  };

  const renderPost = ({ item: post }: { item: ForumPost }) => (
    <Pressable style={styles.postCard} onPress={() => router.push('/panel/ver-publicacion')}>
      <View style={[styles.postAccent, { backgroundColor: post.accent }]} />
      <View style={styles.postBody}>
        <View style={styles.postHeader}>
          <View style={[styles.userAvatar, { backgroundColor: `${post.accent}22` }]}>
            {post.avatar ? <Image source={{ uri: post.avatar }} style={styles.avatarPhoto} contentFit="cover" /> : <UserRound color={post.accent} size={22} />}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.name}</Text>
            <Text style={styles.userMeta}>{post.role} ? {post.time}</Text>
          </View>
        </View>
        <Text style={styles.postText}>{post.text}</Text>
        {post.image ? <Image source={{ uri: post.image }} style={styles.postImage} contentFit="cover" /> : null}
        <View style={styles.postActions}>
          <SocialAction icon={<Heart color="#BF211E" size={17} />} text={`${post.likes}`} />
          <SocialAction icon={<MessageCircle color="#006CAF" size={17} />} text={`${post.comments}`} />
          <SocialAction icon={<Share2 color="#687784" size={17} />} text="Compartir" />
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.container}
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        onEndReached={loadMorePosts}
        onEndReachedThreshold={0.45}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function getPublicationPagination(data: unknown) {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const currentPage = typeof record.current_page === 'number' ? record.current_page : 1;
  const lastPage = typeof record.last_page === 'number' ? record.last_page : currentPage;
  const hasNextPage = Boolean(record.next_page_url) || currentPage < lastPage;
  return { currentPage, hasNextPage };
}

function mergePosts(current: ForumPost[], next: ForumPost[]) {
  const seen = new Set(current.map((post) => post.id));
  const merged = [...current];
  next.forEach((post) => {
    if (!seen.has(post.id)) {
      seen.add(post.id);
      merged.push(post);
    }
  });
  return merged;
}

function SocialAction({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.socialAction}>
      {icon}
      <Text style={styles.socialText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: {
    alignItems: 'center',
    backgroundColor: '#00365A',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
  },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: 0, marginTop: 3 },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  composer: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  composerTop: { flexDirection: 'row', gap: 12 },
  avatar: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, height: 48, justifyContent: 'center', width: 48 },
  avatarLogo: { height: 32, width: 40 },
  composerInputWrap: { flex: 1 },
  composerName: { color: '#00365A', fontSize: 14, fontWeight: '900' },
  composerInput: {
    color: '#1f2d38',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  composerActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  attachButton: { alignItems: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 4, paddingVertical: 8 },
  attachText: { color: '#006CAF', fontSize: 13, fontWeight: '900' },
  postButton: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingVertical: 11 },
  postButtonDisabled: { opacity: 0.7 },
  postButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  feedHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { color: '#00365A', fontSize: 20, fontWeight: '900' },
  sectionAction: { color: '#006CAF', fontSize: 13, fontWeight: '900' },
  postCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  postAccent: { width: 5 },
  postBody: { flex: 1, gap: 12, padding: 14 },
  postHeader: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  userAvatar: { alignItems: 'center', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  avatarPhoto: { borderRadius: 8, height: 44, width: 44 },
  userInfo: { flex: 1 },
  userName: { color: '#00365A', fontSize: 15, fontWeight: '900' },
  userMeta: { color: '#687784', fontSize: 12, marginTop: 2 },
  postText: { color: '#1f2d38', fontSize: 14, lineHeight: 21 },
  postImage: { borderRadius: 8, height: 180, width: '100%' },
  postActions: { borderTopColor: '#eef2f5', borderTopWidth: 1, flexDirection: 'row', gap: 14, paddingTop: 10 },
  socialAction: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  socialText: { color: '#687784', fontSize: 12, fontWeight: '800' },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  endText: { color: '#687784', fontSize: 12, fontWeight: '800', paddingVertical: 12, textAlign: 'center' },
});

