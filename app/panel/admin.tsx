import { BarChart3, BookOpenCheck, ClipboardList, KeyRound, Shield, UserCog, UsersRound } from 'lucide-react-native';
import type React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const adminModules = [
  { title: 'Usuarios', text: 'Gestion de cuentas, accesos y estado.', icon: <UserCog color="#00365A" size={24} />, count: '1,245' },
  { title: 'Roles', text: 'Perfiles administrativos y permisos.', icon: <Shield color="#00365A" size={24} />, count: '08' },
  { title: 'Permisos', text: 'Acciones habilitadas por modulo.', icon: <KeyRound color="#00365A" size={24} />, count: '42' },
  { title: 'Asistencia estudiantes', text: 'Reportes por aula, curso y fecha.', icon: <UsersRound color="#00365A" size={24} />, count: '96%' },
  { title: 'Asistencia docentes', text: 'Registro de sesiones aperturadas.', icon: <ClipboardList color="#00365A" size={24} />, count: '18' },
  { title: 'Cursos activos', text: 'Cargas, horarios y grupos del ciclo.', icon: <BookOpenCheck color="#00365A" size={24} />, count: '24' },
];

export default function AdminScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Administracion</Text>
          <Text style={styles.title}>Centro de control</Text>
          <Text style={styles.subtitle}>Panel base para usuarios, roles, permisos, asistencias y reportes institucionales.</Text>
        </View>

        <View style={styles.reportCard}>
          <View style={styles.reportIcon}>
            <BarChart3 color="#ffffff" size={25} />
          </View>
          <View style={styles.reportCopy}>
            <Text style={styles.reportTitle}>Resumen del ciclo 2026</Text>
            <Text style={styles.reportText}>Matricula activa, control de clases y seguimiento operacional.</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {adminModules.map((module) => (
            <View key={module.title} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.icon}>{module.icon}</View>
                <Text style={styles.count}>{module.count}</Text>
              </View>
              <Text style={styles.cardTitle}>{module.title}</Text>
              <Text style={styles.cardText}>{module.text}</Text>
            </View>
          ))}
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
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  reportCard: { alignItems: 'center', backgroundColor: '#006CAF', borderRadius: 8, flexDirection: 'row', gap: 13, padding: 16 },
  reportIcon: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, height: 52, justifyContent: 'center', width: 52 },
  reportCopy: { flex: 1 },
  reportTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  reportText: { color: '#d9ebf5', fontSize: 12, lineHeight: 18, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexBasis: '47%', flexGrow: 1, minHeight: 154, padding: 14 },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  count: { color: '#00365A', fontSize: 21, fontWeight: '900' },
  cardTitle: { color: '#00365A', fontSize: 15, fontWeight: '900', marginTop: 12 },
  cardText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
