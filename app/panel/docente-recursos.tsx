import { BookOpenCheck, FileText, Layers3, Link as LinkIcon, UsersRound } from 'lucide-react-native';
import type React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const resources = [
  { title: 'Cursos', text: 'Carga academica asignada.', icon: <BookOpenCheck color="#00365A" size={24} />, count: '5' },
  { title: 'Estudiantes', text: 'Listado por carga academica.', icon: <UsersRound color="#00365A" size={24} />, count: '148' },
  { title: 'Cuadernillos', text: 'Material semanal por curso.', icon: <FileText color="#00365A" size={24} />, count: '18' },
  { title: 'Temarios', text: 'Plan de temas por ciclo.', icon: <FileText color="#00365A" size={24} />, count: '9' },
  { title: 'Sesiones', text: 'Registro de sesiones dictadas.', icon: <Layers3 color="#00365A" size={24} />, count: '12' },
  { title: 'Links', text: 'Enlaces de clase virtual.', icon: <LinkIcon color="#00365A" size={24} />, count: '5' },
];

export default function TeacherResourcesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Recursos docente</Text>
          <Text style={styles.title}>Cursos, temarios y sesiones</Text>
          <Text style={styles.subtitle}>Gestiona materiales academicos y seguimiento de tus grupos.</Text>
        </View>
        <View style={styles.grid}>
          {resources.map((resource) => (
            <View key={resource.title} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.icon}>{resource.icon}</View>
                <Text style={styles.count}>{resource.count}</Text>
              </View>
              <Text style={styles.cardTitle}>{resource.title}</Text>
              <Text style={styles.cardText}>{resource.text}</Text>
            </View>
          ))}
        </View>
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>Proxima sesion</Text>
          <Text style={styles.sessionText}>Razonamiento Matematico · Grupo A · Lunes 08:00</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '900', lineHeight: 32, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexBasis: '47%', flexGrow: 1, minHeight: 150, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  count: { color: '#00365A', fontSize: 23, fontWeight: '900' },
  cardTitle: { color: '#00365A', fontSize: 16, fontWeight: '900', marginTop: 12 },
  cardText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 4 },
  sessionCard: { backgroundColor: '#0F7A59', borderRadius: 8, padding: 16 },
  sessionTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  sessionText: { color: '#e0f6ed', fontSize: 13, lineHeight: 19, marginTop: 4 },
});
