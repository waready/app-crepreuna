import { CalendarCheck, CheckCircle2, Clock, RefreshCw, XCircle } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListSkeleton } from '@/components/ui/skeleton';
import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { findArray, findRecord, pickString } from '@/services/normalizers';

const fallbackAttendance = [
  { id: 'demo-1', day: 'Lunes 15', course: 'Asistencia', status: 'Asistio', color: '#0F7A59', time: '13:00 - 17:20' },
  { id: 'demo-2', day: 'Miercoles 17', course: 'Asistencia', status: 'Tardanza', color: '#F27A1A', time: '13:00 - 17:20' },
  { id: 'demo-3', day: 'Viernes 19', course: 'Asistencia', status: 'Falta', color: '#BF211E', time: '13:00 - 17:20' },
];

export default function AttendanceScreen() {
  const loadAttendance = useCallback(async () => {
    const [asistencias, rangoFechas] = await Promise.all([api.getAsistencias(), api.getRangoFechas().catch(() => null)]);
    return { asistencias, rangoFechas };
  }, []);
  const { data, loading, error, refresh } = useApiResource(loadAttendance);
  const apiAttendance = useMemo(() => normalizeAttendance(data?.asistencias), [data]);
  const rangeLabel = useMemo(() => normalizeRangeLabel(data?.rangoFechas), [data]);
  const attendance = apiAttendance.length ? apiAttendance : fallbackAttendance;
  const attended = attendance.filter((item) => item.status.toLowerCase().includes('asist') || item.status.toLowerCase().includes('presente')).length;
  const late = attendance.filter((item) => item.status.toLowerCase().includes('tard')).length;
  const missed = attendance.filter((item) => item.status.toLowerCase().includes('falta') || item.status.toLowerCase().includes('ausente')).length;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <CalendarCheck color="#ffffff" size={30} />
          <Text style={styles.kicker}>Panel estudiante</Text>
          <Text style={styles.title}>Asistencia</Text>
          <Text style={styles.subtitle}>Consulta tu asistencia por curso, fecha y estado. {rangeLabel}</Text>
        </View>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarText}>{loading ? 'Sincronizando registros...' : `${attendance.length} registros encontrados`}</Text>
          <Pressable style={styles.refreshButton} onPress={refresh}>
            <RefreshCw color="#006CAF" size={16} />
            <Text style={styles.refreshText}>Actualizar</Text>
          </Pressable>
        </View>
        {loading && !apiAttendance.length ? <ListSkeleton count={4} /> : null}
        {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}
        <View style={styles.metrics}>
          <Metric label="Asistencias" value={String(attended).padStart(2, '0')} />
          <Metric label="Tardanzas" value={String(late).padStart(2, '0')} />
          <Metric label="Faltas" value={String(missed).padStart(2, '0')} />
        </View>

        <View style={styles.legend}>
          <LegendDot color="#0F7A59" label="Presente" />
          <LegendDot color="#F2B705" label="Tarde" />
          <LegendDot color="#BF211E" label="Falta" />
        </View>
        {(!loading || apiAttendance.length ? attendance : []).map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={[styles.icon, { backgroundColor: `${item.color}22` }]}>
              {isMissed(item.status) ? <XCircle color={item.color} size={23} /> : <CheckCircle2 color={item.color} size={23} />}
            </View>
            <View style={styles.copy}>
              <Text style={styles.itemTitle}>{item.day}</Text>
              <Text style={styles.itemText}>{item.course} ? {item.time}</Text>
            </View>
            <View style={[styles.status, { backgroundColor: item.color }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        ))}
        <View style={styles.note}>
          <Clock color="#006CAF" size={20} />
          <Text style={styles.noteText}>Los registros se actualizan cuando el docente cierra la asistencia.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function normalizeAttendance(data: unknown) {
  const rows = extractAttendanceRows(data);

  return rows.map((item, index) => {
    const horario = findRecord(item.horario, ['horario']);
    const curso = findRecord(item.curso ?? horario.curso, ['curso']);
    const className = pickString(item, ['class', 'className', 'backgroundColor'], '');
    const rawStatus = className || pickString(item, ['estado_asistencia', 'estado', 'status', 'asistencia', 'tipo'], '1');
    const status = attendanceStatusLabel(rawStatus);
    const color = attendanceStatusColor(status);
    const start = pickString(item, ['start', 'fecha_inicio', 'inicio', 'fecha', 'created_at'], '');
    const end = pickString(item, ['end', 'fecha_fin', 'fin'], '');

    return {
      id: pickString(item, ['id'], `${start || pickString(item, ['fecha', 'dia'], 'registro')}-${index}`),
      day: formatAttendanceDate(start || pickString(item, ['fecha', 'dia', 'day', 'created_at'], `Registro ${index + 1}`)),
      course: pickString(item, ['title', 'titulo'], pickString(curso, ['denominacion', 'curso', 'nombre', 'asignatura'], 'Asistencia')),
      status,
      color,
      time: formatAttendanceTime(start, end),
    };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

function extractAttendanceRows(data: unknown) {
  const direct = findArray(data, ['asistencias', 'asistencia', 'registros', 'data', 'items']);
  const expanded: Record<string, unknown>[] = [];

  direct.forEach((item) => {
    const nested = findArray(item.asistencias ?? item.detalles ?? item.registros, ['asistencias', 'detalles', 'registros']);
    if (nested.length) {
      nested.forEach((child) => expanded.push({ ...child, fecha: pickString(child, ['fecha'], pickString(item, ['fecha', 'dia'], '')) }));
    } else {
      expanded.push(item);
    }
  });

  return expanded;
}

function attendanceStatusLabel(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes('danger') || ['0', '3', 'f', 'falta', 'ausente'].includes(normalized) || normalized.includes('falt') || normalized.includes('ausen')) {
    return 'Falta';
  }
  if (normalized.includes('warning') || ['2', 't', 'tardanza'].includes(normalized) || normalized.includes('tard')) {
    return 'Tardanza';
  }
  if (normalized.includes('success') || ['1', 'a', 'asistio', 'asistio.', 'presente'].includes(normalized) || normalized.includes('asist') || normalized.includes('present')) {
    return 'Asistio';
  }
  return value || 'Registrado';
}

function attendanceStatusColor(status: string) {
  if (isMissed(status)) return '#BF211E';
  if (status.toLowerCase().includes('tard')) return '#F27A1A';
  return '#0F7A59';
}

function isMissed(status: string) {
  const normalized = status.toLowerCase();
  return normalized.includes('falta') || normalized.includes('ausente');
}

function normalizeRangeLabel(data: unknown) {
  const record = findRecord(data, ['rango', 'data']);
  const inicio = pickString(record, ['inicio', 'fecha_inicio', 'desde'], '');
  const fin = pickString(record, ['fin', 'fecha_fin', 'hasta'], '');
  if (inicio && fin) {
    return `Periodo ${inicio} - ${fin}.`;
  }
  return '';
}


function formatAttendanceDate(value: string) {
  if (!value || value.startsWith('Registro')) return value;
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${days[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}`;
}

function formatAttendanceTime(start: string, end: string) {
  const startTime = start.includes(' ') ? start.split(' ')[1]?.slice(0, 5) : '';
  const endTime = end.includes(' ') ? end.split(' ')[1]?.slice(0, 5) : '';
  return [startTime, endTime].filter(Boolean).join(' - ') || 'Horario por confirmar';
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
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
  header: { backgroundColor: '#00365A', borderRadius: 8, gap: 8, padding: 18 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 30, fontWeight: '900' },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20 },
  toolbar: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  toolbarText: { color: '#365465', flex: 1, fontSize: 12, fontWeight: '800' },
  refreshButton: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, flexDirection: 'row', gap: 6, paddingHorizontal: 10, paddingVertical: 8 },
  refreshText: { color: '#006CAF', fontSize: 12, fontWeight: '900' },
  metrics: { flexDirection: 'row', gap: 10 },
  legend: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendDot: { borderRadius: 999, height: 10, width: 10 },
  legendText: { color: '#45525d', fontSize: 11, fontWeight: '900' },
  metric: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flex: 1, padding: 13 },
  metricValue: { color: '#00365A', fontSize: 23, fontWeight: '900' },
  metricLabel: { color: '#687784', fontSize: 10, fontWeight: '900', marginTop: 2, textTransform: 'uppercase' },
  item: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 13 },
  icon: { alignItems: 'center', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  copy: { flex: 1 },
  itemTitle: { color: '#00365A', fontSize: 15, fontWeight: '900' },
  itemText: { color: '#687784', fontSize: 12, marginTop: 3 },
  status: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  statusText: { color: '#ffffff', fontSize: 11, fontWeight: '900' },
  note: { alignItems: 'center', backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13 },
  noteText: { color: '#365465', flex: 1, fontSize: 12, lineHeight: 18 },
  infoText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});
