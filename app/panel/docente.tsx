import { router } from 'expo-router';
import { BookOpen, CalendarDays, ClipboardCheck, FileText, Layers3, UsersRound } from 'lucide-react-native';
import type React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const modules = [
  { title: 'Horario docente', text: 'Bloques asignados y enlaces de clase.', icon: <CalendarDays color="#00365A" size={25} />, route: '/panel/docente-horarios' },
  { title: 'Recursos', text: 'Cursos, carga academica y estudiantes.', icon: <BookOpen color="#00365A" size={25} />, route: '/panel/docente-recursos' },
  { title: 'Asistencia', text: 'Aperturar, registrar y cerrar asistencia.', icon: <ClipboardCheck color="#00365A" size={25} />, route: '/panel/docente-asistencia' },
  { title: 'Temarios', text: 'Planificacion de temas por curso.', icon: <FileText color="#00365A" size={25} />, route: '/panel/docente-recursos' },
  { title: 'Sesiones', text: 'Lista y gestion de sesiones academicas.', icon: <Layers3 color="#00365A" size={25} />, route: '/panel/docente-recursos' },
  { title: 'Estudiantes', text: 'Relacion de estudiantes por carga.', icon: <UsersRound color="#00365A" size={25} />, route: '/panel/docente-recursos' },
];

export default function TeacherScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Panel docente</Text>
          <Text style={styles.title}>Gestion academica</Text>
          <Text style={styles.subtitle}>Administra clases, recursos, asistencia y sesiones desde una experiencia movil.</Text>
        </View>
        <View style={styles.metrics}>
          <Metric value="05" label="Cursos" />
          <Metric value="148" label="Estudiantes" />
          <Metric value="12" label="Sesiones" />
        </View>
        <View style={styles.grid}>
          {modules.map((module) => (
            <Pressable key={module.title} style={styles.card} onPress={() => router.push(module.route as never)}>
              <View style={styles.cardIcon}>{module.icon}</View>
              <Text style={styles.cardTitle}>{module.title}</Text>
              <Text style={styles.cardText}>{module.text}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', letterSpacing: 0, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  metrics: { flexDirection: 'row', gap: 10 },
  metric: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flex: 1, padding: 13 },
  metricValue: { color: '#00365A', fontSize: 23, fontWeight: '900' },
  metricLabel: { color: '#687784', fontSize: 10, fontWeight: '900', marginTop: 2, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexBasis: '47%', flexGrow: 1, minHeight: 160, padding: 14 },
  cardIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 46, justifyContent: 'center', marginBottom: 12, width: 46 },
  cardTitle: { color: '#00365A', fontSize: 16, fontWeight: '900' },
  cardText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 5 },
});
