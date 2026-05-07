import { CalendarDays, Clock, Link as LinkIcon, MapPin, Phone, UserRound, UsersRound } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListSkeleton } from '@/components/ui/skeleton';
import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { normalizeRepoSchedule } from '@/services/cepreuna-mappers';
import { findArray, findRecord, pickString } from '@/services/normalizers';

const fallbackDays = [
  {
    day: 'Lunes',
    blocks: [
      { time: '08:00 - 09:30', course: 'Razonamiento Matematico', teacher: 'Mg. Carlos Quispe', color: '#006CAF' },
      { time: '10:00 - 11:30', course: 'Comunicacion', teacher: 'Lic. Ana Mamani', color: '#0F7A59' },
    ],
  },
  {
    day: 'Miercoles',
    blocks: [
      { time: '08:00 - 09:30', course: 'Biologia', teacher: 'Dra. Rosa Flores', color: '#BF211E' },
      { time: '11:40 - 13:00', course: 'Quimica', teacher: 'Dr. Luis Huanca', color: '#7A4E00' },
    ],
  },
  {
    day: 'Viernes',
    blocks: [
      { time: '09:40 - 11:10', course: 'Fisica', teacher: 'Mg. Pedro Ccallo', color: '#4B5FC0' },
    ],
  },
];

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState('');
  const loadSchedule = useCallback(() => api.getHorario(), []);
  const { data, loading, error } = useApiResource(loadSchedule);
  const apiDays = useMemo(() => {
    const repoDays = normalizeRepoSchedule(data);
    return repoDays.length ? repoDays : normalizeSchedule(data);
  }, [data]);
  const scheduleMeta = useMemo(() => normalizeScheduleMeta(data), [data]);
  const days = apiDays.length ? apiDays : fallbackDays;
  const activeDay = days.find((day) => day.day === selectedDay) ?? days[0];

  useEffect(() => {
    if (!selectedDay && days[0]?.day) {
      setSelectedDay(days[0].day);
    }
  }, [days, selectedDay]);

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Horario de clases</Text>
          <Text style={styles.title}>Grupo A · Area Ingenierias</Text>
          <View style={styles.headerMeta}>
            <View style={styles.metaPill}>
              <MapPin color="#BFE8FF" size={15} />
              <Text style={styles.metaText}>Grupo {scheduleMeta.group}</Text>
            </View>
            <View style={styles.metaPill}>
              <CalendarDays color="#BFE8FF" size={15} />
              <Text style={styles.metaText}>Horario vigente</Text>
            </View>
          </View>
        </View>
        <View style={styles.auxiliaryCard}>
          <View style={styles.auxiliaryIcon}>
            <UsersRound color="#00365A" size={22} />
          </View>
          <View style={styles.auxiliaryCopy}>
            <Text style={styles.auxiliaryLabel}>Auxiliar / Tutor</Text>
            <Text style={styles.auxiliaryName}>{scheduleMeta.auxiliaryName}</Text>
            <Pressable style={styles.phoneRow} onPress={() => scheduleMeta.auxiliaryPhone && Linking.openURL(`tel:${scheduleMeta.auxiliaryPhone}`)}>
              <Phone color="#0F7A59" size={14} />
              <Text style={styles.phoneText}>{scheduleMeta.auxiliaryPhone || 'Celular pendiente'}</Text>
            </Pressable>
          </View>
        </View>

        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}

        {(!loading || apiDays.length) && days.length ? (
          <View style={styles.tabs}>
            {days.map((day) => (
              <Pressable key={day.day} style={[styles.tabButton, activeDay?.day === day.day && styles.tabButtonActive]} onPress={() => setSelectedDay(day.day)}>
                <Text style={[styles.tabText, activeDay?.day === day.day && styles.tabTextActive]}>{shortDay(day.day)}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {activeDay && (!loading || apiDays.length) ? (
          <View key={activeDay.day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <CalendarDays color="#00365A" size={20} />
              <View style={styles.dayTitleCopy}>
                <Text style={styles.dayTitle}>{activeDay.day}</Text>
                <Text style={styles.daySubtitle}>{activeDay.blocks.length} bloques de clase</Text>
              </View>
            </View>
            {activeDay.blocks.map((block) => (
              <View key={`${activeDay.day}-${block.time}-${block.course}`} style={styles.block}>
                <View style={[styles.blockStripe, { backgroundColor: block.color }]} />
                <View style={styles.blockContent}>
                  <View style={styles.timeRow}>
                    <Clock color="#006CAF" size={15} />
                    <Text style={styles.timeText}>{block.time}</Text>
                  </View>
                  <Text style={styles.course}>{block.course}</Text>
                  <View style={styles.teacherRow}>
                    <UserRound color="#687784" size={15} />
                    <Text style={styles.teacher}>{block.teacher}</Text>
                  </View>
                  <Pressable
                    style={[styles.linkButton, !block.link && styles.linkButtonDisabled]}
                    onPress={() => block.link && Linking.openURL(block.link)}
                    disabled={!block.link}>
                    <LinkIcon color="#ffffff" size={15} />
                    <Text style={styles.linkText}>{block.link ? 'Unirse a la clase' : 'Sin enlace virtual'}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeScheduleMeta(data: unknown) {
  const record = findRecord(data);
  const turnos = findArray(record.horario, ['horario']);
  const firstTurno = turnos[0] ?? {};
  const auxiliarGrupo = findRecord(record.auxiliar_grupo, ['auxiliar_grupo']);
  const auxiliar = findRecord(auxiliarGrupo.auxiliar, ['auxiliar']);
  const user = findRecord(auxiliar.user, ['user']);
  const auxiliaryName = [
    pickString(user, ['paterno'], ''),
    pickString(user, ['materno'], ''),
    pickString(user, ['name', 'nombres'], ''),
  ].filter(Boolean).join(' ');

  return {
    group: pickString(record, ['grupo'], 'A'),
    area: pickString(record, ['area'], 'Area academica'),
    turno: pickString(firstTurno, ['turno'], 'Turno'),
    auxiliaryName: auxiliaryName || 'Auxiliar asignado',
    auxiliaryPhone: pickString(auxiliar, ['telefono', 'celular'], ''),
  };
}

function shortDay(day: string) {
  const labels: Record<string, string> = {
    Lunes: 'Lu',
    Martes: 'Ma',
    Miercoles: 'Mi',
    Jueves: 'Ju',
    Viernes: 'Vi',
    Sabado: 'Sa',
    Domingo: 'Do',
  };
  return labels[day] ?? day.slice(0, 2);
}

function normalizeSchedule(data: unknown) {
  const rows = findArray(data, ['horarios', 'data', 'items']);
  const grouped = new Map<string, { time: string; course: string; teacher: string; color: string; link: string }[]>();

  rows.forEach((item, index) => {
    const day = pickString(item, ['dia', 'day', 'fecha'], 'Dia');
    const start = pickString(item, ['hora_inicio', 'inicio', 'start', 'hora'], '');
    const end = pickString(item, ['hora_fin', 'fin', 'end'], '');
    const time = pickString(item, ['horario', 'time'], [start, end].filter(Boolean).join(' - ') || 'Horario por confirmar');
    const block = {
      time,
      course: pickString(item, ['curso', 'asignatura', 'nombre', 'materia'], 'Curso CEPREUNA'),
      teacher: pickString(item, ['docente', 'profesor', 'teacher'], 'Docente asignado'),
      color: ['#006CAF', '#0F7A59', '#BF211E', '#7A4E00'][index % 4],
      link: pickString(item, ['link', 'url'], ''),
    };
    grouped.set(day, [...(grouped.get(day) ?? []), block]);
  });

  return Array.from(grouped.entries()).map(([day, blocks]) => ({ day, blocks }));
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 27, fontWeight: '900', letterSpacing: 0, lineHeight: 31, marginTop: 4 },
  headerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metaPill: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  metaText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  auxiliaryCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  auxiliaryIcon: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, height: 48, justifyContent: 'center', width: 48 },
  auxiliaryCopy: { flex: 1 },
  auxiliaryLabel: { color: '#687784', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  auxiliaryName: { color: '#00365A', fontSize: 15, fontWeight: '900', marginTop: 3 },
  phoneRow: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 5, marginTop: 7 },
  phoneText: { color: '#0F7A59', fontSize: 12, fontWeight: '900' },
  tabs: { backgroundColor: '#e8f0f5', borderRadius: 8, flexDirection: 'row', gap: 5, padding: 5 },
  tabButton: { alignItems: 'center', borderRadius: 7, flex: 1, justifyContent: 'center', minHeight: 40 },
  tabButtonActive: { backgroundColor: '#00365A', boxShadow: '0px 5px 14px rgba(0, 28, 48, 0.12)' },
  tabText: { color: '#687784', fontSize: 12, fontWeight: '900' },
  tabTextActive: { color: '#ffffff' },
  dayCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 10, padding: 14 },
  dayHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dayTitleCopy: { flex: 1 },
  dayTitle: { color: '#00365A', fontSize: 20, fontWeight: '900' },
  daySubtitle: { color: '#687784', fontSize: 12, fontWeight: '700', marginTop: 2 },
  block: { backgroundColor: '#f9fbfd', borderRadius: 8, flexDirection: 'row', overflow: 'hidden' },
  blockStripe: { width: 5 },
  blockContent: { flex: 1, gap: 8, padding: 12 },
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  timeText: { color: '#006CAF', fontSize: 12, fontWeight: '900' },
  course: { color: '#00365A', fontSize: 16, fontWeight: '900' },
  teacherRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  teacher: { color: '#687784', fontSize: 12, fontWeight: '700' },
  linkButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  linkButtonDisabled: { backgroundColor: '#8ba0ad' },
  linkText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  infoText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});
