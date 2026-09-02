import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Timer,
  TriangleAlert,
  UsersRound,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Metric,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { AttendanceItem, StudentAttendance } from '@/services/api-types';
import { formatDate, periodLabel } from '@/utils/format';

type Filter = 'todos' | 'asistio' | 'observado';

export default function AttendanceScreen() {
  const { role, period } = useSession();
  const teacher = role === 'docente';
  const [studentData, setStudentData] = useState<StudentAttendance>();
  const [items, setItems] = useState<AttendanceItem[]>([]);
  const [filter, setFilter] = useState<Filter>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
    // Reload only when the active role changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher]);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      if (teacher) {
        const next = await api.teacher.attendance();
        setItems(next);
        setStudentData(undefined);
      } else {
        const next = await api.student.attendance();
        setStudentData(next);
        setItems(next.asistencias || []);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la asistencia.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const attended = items.filter((item) => isAttended(item.estado, item.estado_label)).length;
  const observed = items.length - attended;
  const totalHours = items.reduce((sum, item) => sum + Number(item.cantidad_horas || item.horas_pago || 0), 0);
  const filtered = items.filter((item) => {
    if (filter === 'todos') return true;
    const present = isAttended(item.estado, item.estado_label);
    return filter === 'asistio' ? present : !present;
  });

  const range = studentData?.rango;
  const rangeLabel = range?.inicio || range?.fin
    ? `${range.inicio ? formatDate(range.inicio) : 'Inicio'} - ${range.fin ? formatDate(range.fin) : 'Actualidad'}`
    : undefined;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow={teacher ? 'Registro docente' : 'Seguimiento academico'}
        period={periodLabel(period)}
        subtitle={teacher
          ? 'Revisa las sesiones registradas y las horas reconocidas en el ciclo activo.'
          : 'Consulta tu puntualidad por fecha y curso.'}
        title="Asistencia"
      />

      <View style={styles.metrics}>
        <Metric icon={CalendarCheck} label="Registros" value={items.length} />
        <Metric icon={CheckCircle2} label={teacher ? 'Completados' : 'Asistencias'} tone="success" value={attended} />
        <Metric
          icon={teacher ? Timer : TriangleAlert}
          label={teacher ? 'Horas' : 'Observados'}
          tone={observed ? 'warning' : 'info'}
          value={teacher ? totalHours : observed}
        />
      </View>

      <View style={styles.content}>
        <SectionTitle
          subtitle={rangeLabel || `${filtered.length} registros encontrados`}
          title={teacher ? 'Sesiones dictadas' : 'Historial del ciclo'}
        />
        <View style={styles.filters}>
          <FilterChip active={filter === 'todos'} label="Todos" onPress={() => setFilter('todos')} />
          <FilterChip active={filter === 'asistio'} label={teacher ? 'Completados' : 'Asistencias'} onPress={() => setFilter('asistio')} />
          <FilterChip active={filter === 'observado'} label="Observados" onPress={() => setFilter('observado')} />
        </View>

        {loading ? <LoadingState label="Consultando asistencia..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {!loading && !error && !filtered.length ? (
          <EmptyState
            icon={CalendarCheck}
            message={items.length ? 'No existen registros con este filtro.' : 'Todavia no se registraron asistencias en el ciclo activo.'}
            title={items.length ? 'Sin coincidencias' : 'Sin asistencias'}
          />
        ) : null}

        {!loading && !error ? filtered.map((item) => (
          <AttendanceCard item={item} key={item.id} teacher={teacher} />
        )) : null}
      </View>
    </Screen>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.filter, active && styles.filterActive, pressed && styles.pressed]}>
      <AppText color={active ? theme.colors.primary : theme.colors.textMuted} variant="micro">{label}</AppText>
    </Pressable>
  );
}

function AttendanceCard({ item, teacher }: { item: AttendanceItem; teacher: boolean }) {
  const status = attendanceStatus(item.estado, item.estado_label);
  const Icon = status.icon;
  return (
    <Card style={styles.card}>
      <View style={[styles.statusLine, { backgroundColor: status.color }]} />
      <View style={styles.cardTop}>
        <View style={[styles.dateIcon, { backgroundColor: status.soft }]}>
          <Icon color={status.color} size={21} />
        </View>
        <View style={styles.cardTitle}>
          <AppText variant="heading">{formatDate(item.fecha)}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {[item.hora_inicio, item.hora_fin].filter(Boolean).join(' - ') || 'Horario no indicado'}
          </AppText>
        </View>
        <Pill label={item.estado_label || item.estado || 'Registrado'} tone={status.tone} />
      </View>

      <View style={styles.courseBox}>
        <GraduationCap color={theme.colors.accent} size={19} />
        <View style={styles.courseCopy}>
          <AppText variant="label">{item.curso || 'Actividad academica'}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {[item.grupo ? `Grupo ${item.grupo}` : null, item.tema].filter(Boolean).join(' / ') || 'Sin detalle adicional'}
          </AppText>
        </View>
      </View>

      {teacher ? (
        <View style={styles.teacherMeta}>
          <View style={styles.metaItem}>
            <Clock3 color={theme.colors.textMuted} size={16} />
            <AppText color={theme.colors.textSoft} variant="caption">
              {item.cantidad_horas || item.horas_pago || 0} horas
            </AppText>
          </View>
          <View style={styles.metaItem}>
            <UsersRound color={theme.colors.textMuted} size={16} />
            <AppText color={theme.colors.textSoft} variant="caption">
              {item.cantidad_estudiantes ?? 0} estudiantes
            </AppText>
          </View>
        </View>
      ) : null}
      {item.observacion ? (
        <AppText color={theme.colors.textSoft} style={styles.observation} variant="caption">
          {item.observacion}
        </AppText>
      ) : null}
    </Card>
  );
}

function isAttended(status?: string, label?: string) {
  const value = `${status || ''} ${label || ''}`.toLowerCase();
  return ['asist', 'presente', 'complet', 'dictad', 'puntual'].some((word) => value.includes(word));
}

function attendanceStatus(status?: string, label?: string) {
  const value = `${status || ''} ${label || ''}`.toLowerCase();
  if (isAttended(status, label)) {
    return { color: theme.colors.success, soft: theme.colors.successSoft, tone: 'success' as const, icon: CheckCircle2 };
  }
  if (value.includes('tard')) {
    return { color: theme.colors.warning, soft: theme.colors.warningSoft, tone: 'warning' as const, icon: Clock3 };
  }
  return { color: theme.colors.danger, soft: theme.colors.dangerSoft, tone: 'danger' as const, icon: TriangleAlert };
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 9, marginHorizontal: 16, marginTop: -2 },
  content: { gap: 12, paddingHorizontal: 16, paddingTop: 22 },
  filters: { flexDirection: 'row', gap: 8 },
  filter: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  filterActive: { backgroundColor: theme.colors.accentSoft, borderColor: '#9CD4E8' },
  pressed: { opacity: 0.78 },
  card: { gap: 13, marginBottom: 0, overflow: 'hidden' },
  statusLine: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 4 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  dateIcon: { alignItems: 'center', borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  cardTitle: { flex: 1 },
  courseBox: {
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: 9,
    padding: 11,
  },
  courseCopy: { flex: 1 },
  teacherMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  observation: { backgroundColor: theme.colors.warningSoft, borderRadius: 12, padding: 10 },
});
