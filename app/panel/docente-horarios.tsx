import { CalendarDays, Clock, Link as LinkIcon, UsersRound } from 'lucide-react-native';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const blocks = [
  { day: 'Lunes', time: '08:00 - 09:30', course: 'Razonamiento Matematico', group: 'Grupo A', color: '#006CAF' },
  { day: 'Martes', time: '10:00 - 11:30', course: 'Fisica', group: 'Grupo B', color: '#4B5FC0' },
  { day: 'Jueves', time: '08:00 - 09:30', course: 'Razonamiento Matematico', group: 'Grupo C', color: '#0F7A59' },
];

export default function TeacherScheduleScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Docente</Text>
          <Text style={styles.title}>Horario asignado</Text>
          <Text style={styles.subtitle}>Carga horaria por grupos, cursos y enlaces de clase.</Text>
        </View>
        {blocks.map((block) => (
          <View key={`${block.day}-${block.group}`} style={styles.block}>
            <View style={[styles.stripe, { backgroundColor: block.color }]} />
            <View style={styles.content}>
              <View style={styles.row}>
                <CalendarDays color={block.color} size={18} />
                <Text style={styles.day}>{block.day}</Text>
              </View>
              <Text style={styles.course}>{block.course}</Text>
              <View style={styles.metaRow}>
                <Meta icon={<Clock color="#006CAF" size={15} />} text={block.time} />
                <Meta icon={<UsersRound color="#006CAF" size={15} />} text={block.group} />
              </View>
              <View style={styles.linkButton}>
                <LinkIcon color="#ffffff" size={15} />
                <Text style={styles.linkText}>Gestionar enlace</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.meta}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 29, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  block: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  stripe: { width: 5 },
  content: { flex: 1, gap: 10, padding: 14 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  day: { color: '#00365A', fontSize: 18, fontWeight: '900' },
  course: { color: '#00365A', fontSize: 16, fontWeight: '900' },
  metaRow: { flexDirection: 'row', gap: 8 },
  meta: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  metaText: { color: '#006CAF', fontSize: 11, fontWeight: '900' },
  linkButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 9 },
  linkText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});
