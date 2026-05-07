import { CheckCircle2, Clock3, LockKeyhole, PlayCircle, Search, UserCheck, UsersRound, XCircle } from 'lucide-react-native';
import type React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const students = [
  { name: 'Ariana Quispe Mamani', code: '20260124', status: 'Presente', color: '#0F7A59' },
  { name: 'Diego Flores Condori', code: '20260087', status: 'Tarde', color: '#C77700' },
  { name: 'Lucia Ramos Apaza', code: '20260211', status: 'Presente', color: '#0F7A59' },
  { name: 'Mateo Huanca Pari', code: '20260102', status: 'Falta', color: '#BF211E' },
];

export default function TeacherAttendanceScreen() {
  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Asistencia docente</Text>
          <Text style={styles.title}>Control de aula</Text>
          <Text style={styles.subtitle}>Apertura la sesion, registra asistencia y cierra el parte academico del dia.</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View>
              <Text style={styles.statusLabel}>Sesion actual</Text>
              <Text style={styles.statusTitle}>Razonamiento Matematico</Text>
              <Text style={styles.statusText}>Grupo A · Aula 204 · 08:00 - 10:00</Text>
            </View>
            <View style={styles.openBadge}>
              <PlayCircle color="#ffffff" size={16} />
              <Text style={styles.openText}>Abierta</Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Action icon={<PlayCircle color="#ffffff" size={17} />} title="Aperturar" primary />
            <Action icon={<UserCheck color="#00365A" size={17} />} title="Guardar" />
            <Action icon={<LockKeyhole color="#00365A" size={17} />} title="Cerrar" />
          </View>
        </View>

        <View style={styles.metrics}>
          <Metric icon={<UsersRound color="#00365A" size={19} />} value="38" label="Matriculados" />
          <Metric icon={<CheckCircle2 color="#0F7A59" size={19} />} value="31" label="Presentes" />
          <Metric icon={<Clock3 color="#C77700" size={19} />} value="04" label="Tardanzas" />
          <Metric icon={<XCircle color="#BF211E" size={19} />} value="03" label="Faltas" />
        </View>

        <View style={styles.searchBox}>
          <Search color="#6c7f8f" size={18} />
          <Text style={styles.searchText}>Buscar estudiante por DNI, codigo o nombre</Text>
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Lista de estudiantes</Text>
          {students.map((student) => (
            <View key={student.code} style={styles.studentRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student.name.slice(0, 1)}</Text>
              </View>
              <View style={styles.studentCopy}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentCode}>Codigo {student.code}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: student.color }]}>
                <Text style={styles.statusPillText}>{student.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.metric}>
      {icon}
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Action({ icon, title, primary }: { icon: React.ReactNode; title: string; primary?: boolean }) {
  return (
    <Pressable style={[styles.action, primary && styles.actionPrimary]}>
      {icon}
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  statusCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 14, padding: 16 },
  statusTop: { gap: 12 },
  statusLabel: { color: '#006CAF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  statusTitle: { color: '#00365A', fontSize: 21, fontWeight: '900', marginTop: 3 },
  statusText: { color: '#687784', fontSize: 12, marginTop: 4 },
  openBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#0F7A59', borderRadius: 999, flexDirection: 'row', gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  openText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  actions: { flexDirection: 'row', gap: 8 },
  action: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 5, justifyContent: 'center', paddingVertical: 11 },
  actionPrimary: { backgroundColor: '#006CAF' },
  actionText: { color: '#00365A', fontSize: 11, fontWeight: '900' },
  actionTextPrimary: { color: '#ffffff' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexBasis: '47%', flexGrow: 1, padding: 13 },
  metricValue: { color: '#00365A', fontSize: 22, fontWeight: '900', marginTop: 6 },
  metricLabel: { color: '#687784', fontSize: 10, fontWeight: '900', marginTop: 2, textTransform: 'uppercase' },
  searchBox: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 14 },
  searchText: { color: '#6c7f8f', flex: 1, fontSize: 12, fontWeight: '700' },
  listCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 14 },
  sectionTitle: { color: '#00365A', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  studentRow: { alignItems: 'center', borderTopColor: '#edf3f7', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 12 },
  avatar: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 999, height: 38, justifyContent: 'center', width: 38 },
  avatarText: { color: '#00365A', fontSize: 14, fontWeight: '900' },
  studentCopy: { flex: 1 },
  studentName: { color: '#00365A', fontSize: 13, fontWeight: '900' },
  studentCode: { color: '#687784', fontSize: 11, marginTop: 2 },
  statusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  statusPillText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
});
