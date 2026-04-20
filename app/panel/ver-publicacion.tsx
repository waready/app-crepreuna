import { Heart, MessageCircle, Send, Share2, UserRound } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const comments = [
  { name: 'Sofia', text: 'Gracias profe, el material del simulacro esta muy claro.' },
  { name: 'Brayan', text: 'Podrian subir tambien la solucion del ejercicio 12?' },
];

export default function PublicationDetailScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Publicacion</Text>
          <Text style={styles.title}>Foro CEPREUNA</Text>
          <Text style={styles.subtitle}>Vista de detalle para publicaciones, respuestas e interacciones.</Text>
        </View>

        <View style={styles.postCard}>
          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <UserRound color="#00365A" size={20} />
            </View>
            <View>
              <Text style={styles.authorName}>Coordinacion Academica</Text>
              <Text style={styles.authorMeta}>Hoy · 09:20 AM</Text>
            </View>
          </View>
          <Text style={styles.postText}>Recuerden revisar el cuadernillo semanal y resolver el simulacro antes del viernes.</Text>
          <View style={styles.actions}>
            <Action icon={<Heart color="#006CAF" size={17} />} value="124" />
            <Action icon={<MessageCircle color="#006CAF" size={17} />} value="18" />
            <Action icon={<Share2 color="#006CAF" size={17} />} value="Compartir" />
          </View>
        </View>

        <View style={styles.commentInput}>
          <Text style={styles.commentPlaceholder}>Escribe una respuesta institucional...</Text>
          <View style={styles.sendButton}>
            <Send color="#ffffff" size={17} />
          </View>
        </View>

        <View style={styles.commentsCard}>
          <Text style={styles.sectionTitle}>Comentarios</Text>
          {comments.map((comment) => (
            <View key={comment.name} style={styles.comment}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>{comment.name.slice(0, 1)}</Text>
              </View>
              <View style={styles.commentCopy}>
                <Text style={styles.commentName}>{comment.name}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Action({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View style={styles.action}>
      {icon}
      <Text style={styles.actionText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  postCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 13, padding: 15 },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  avatar: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 999, height: 42, justifyContent: 'center', width: 42 },
  authorName: { color: '#00365A', fontSize: 14, fontWeight: '900' },
  authorMeta: { color: '#687784', fontSize: 11, marginTop: 2 },
  postText: { color: '#263d50', fontSize: 15, lineHeight: 23 },
  actions: { borderTopColor: '#edf3f7', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingTop: 12 },
  action: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 999, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  actionText: { color: '#006CAF', fontSize: 11, fontWeight: '900' },
  commentInput: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12 },
  commentPlaceholder: { color: '#687784', flex: 1, fontSize: 12, fontWeight: '700' },
  sendButton: { alignItems: 'center', backgroundColor: '#006CAF', borderRadius: 8, height: 38, justifyContent: 'center', width: 38 },
  commentsCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 15 },
  sectionTitle: { color: '#00365A', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  comment: { borderTopColor: '#edf3f7', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 12 },
  smallAvatar: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 999, height: 34, justifyContent: 'center', width: 34 },
  smallAvatarText: { color: '#00365A', fontSize: 13, fontWeight: '900' },
  commentCopy: { flex: 1 },
  commentName: { color: '#00365A', fontSize: 13, fontWeight: '900' },
  commentText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 2 },
});
