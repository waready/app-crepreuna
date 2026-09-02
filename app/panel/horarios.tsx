import {
  BookOpenText,
  CalendarDays,
  Clock3,
  Coffee,
  MapPinned,
  UserRound,
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
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type {
  Contact,
  ScheduleBlock,
  ScheduleClass,
  StudentSchedule,
  TeacherSchedule,
} from '@/services/api-types';
import { periodLabel } from '@/utils/format';

const days = [
  { id: 1, short: 'Lun', name: 'Lunes' },
  { id: 2, short: 'Mar', name: 'Martes' },
  { id: 3, short: 'Mie', name: 'Miercoles' },
  { id: 4, short: 'Jue', name: 'Jueves' },
  { id: 5, short: 'Vie', name: 'Viernes' },
];

export default function ScheduleScreen() {
  const { role, period } = useSession();
  const teacher = role === 'docente';
  const [studentData, setStudentData] = useState<StudentSchedule>();
  const [teacherData, setTeacherData] = useState<TeacherSchedule>();
  const [selectedDay, setSelectedDay] = useState(defaultDay());
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
      if (teacher) setTeacherData(await api.teacher.schedule());
      else setStudentData(await api.student.schedule());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el horario.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const selectedName = days.find((day) => day.id === selectedDay)?.name || 'Dia';
  const studentBlocks = studentData?.dias?.find((day) => day.id === selectedDay)?.bloques ?? [];
  const teacherClasses = teacherData?.horarios.filter((item) => Number(item.dia) === selectedDay) ?? [];
  const totalClasses = teacher
    ? teacherData?.horarios.length ?? 0
    : studentData?.horarios.length ?? 0;
  const groupCount = teacher
    ? new Set(teacherData?.horarios.map((item) => item.grupo_aulas_id).filter(Boolean)).size
    : studentData?.matricula ? 1 : 0;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        eyebrow="Agenda academica"
        period={periodLabel(period)}
        subtitle={teacher
          ? 'Todas tus cargas del ciclo, ordenadas por dia y hora.'
          : 'Clases de tu grupo actual, de lunes a viernes.'}
        title="Horario semanal"
      />

      <View style={styles.metricsRow}>
        <Metric icon={CalendarDays} label="Clases semanales" value={totalClasses} />
        <Metric icon={UsersRound} label={teacher ? 'Grupos asignados' : 'Grupo activo'} tone="success" value={groupCount} />
        <Metric
          icon={Clock3}
          label={teacher ? 'Clases del dia' : 'Turno'}
          tone="warning"
          value={teacher ? teacherClasses.length : studentData?.matricula?.turno || '--'}
        />
      </View>

      <View style={styles.dayPicker}>
        {days.map((day) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedDay === day.id }}
            key={day.id}
            onPress={() => setSelectedDay(day.id)}
            style={({ pressed }) => [
              styles.dayButton,
              selectedDay === day.id && styles.dayButtonActive,
              pressed && styles.pressed,
            ]}>
            <AppText color={selectedDay === day.id ? palette.paper : theme.colors.textSoft} variant="micro">
              {day.short}
            </AppText>
            <View style={[styles.dayDot, selectedDay === day.id && styles.dayDotActive]} />
          </Pressable>
        ))}
      </View>

      <SectionTitle
        subtitle={`${teacher ? teacherClasses.length : countClasses(studentBlocks)} clases programadas`}
        title={selectedName}
      />

      {loading ? <LoadingState label="Organizando tu semana..." /> : null}
      {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
      {!loading && !error && teacher && teacherClasses.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message="No tienes cargas programadas para este dia."
          title="Dia libre"
        />
      ) : null}
      {!loading && !error && !teacher && studentBlocks.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message="No hay bloques configurados para tu grupo en este dia."
          title="Sin horario disponible"
        />
      ) : null}

      {!loading && !error && teacherClasses.map((item, index) => (
        <ClassCard index={index} item={item} key={item.id} teacher />
      ))}
      {!loading && !error && !teacher && studentBlocks.map((block, index) => (
        <StudentBlock block={block} index={index} key={`${block.plantilla_id}-${index}`} />
      ))}

      {!loading && !error ? (
        <ContactsSection student={studentData} teacher={teacherData} />
      ) : null}
    </Screen>
  );
}

function StudentBlock({ block, index }: { block: ScheduleBlock; index: number }) {
  if (!block.clase) {
    return (
      <View style={styles.breakRow}>
        <View style={styles.timelineColumn}>
          <View style={styles.breakDot}><Coffee color={theme.colors.warning} size={15} /></View>
          <View style={styles.timelineLine} />
        </View>
        <View style={styles.breakCopy}>
          <AppText color={theme.colors.textMuted} variant="caption">
            {block.hora_inicio} - {block.hora_fin}
          </AppText>
          <AppText color={theme.colors.warning} variant="label">{block.tipo || 'Receso'}</AppText>
        </View>
      </View>
    );
  }
  return (
    <ClassCard
      index={index}
      item={{ ...block.clase, hora_inicio: block.hora_inicio, hora_fin: block.hora_fin }}
    />
  );
}

function ClassCard({ item, index, teacher = false }: { item: ScheduleClass; index: number; teacher?: boolean }) {
  const color = safeCourseColor(item.color, index);
  return (
    <View style={styles.classRow}>
      <View style={styles.timelineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: color }]} />
        <View style={styles.timelineLine} />
      </View>
      <Card style={styles.classCard}>
        <View style={styles.classTop}>
          <Pill icon={Clock3} label={`${item.hora_inicio || '--:--'} - ${item.hora_fin || '--:--'}`} tone="accent" />
          {item.tipo ? <Pill label={item.tipo} /> : null}
        </View>
        <AppText variant="heading">{item.curso}</AppText>
        <View style={styles.classMeta}>
          <BookOpenText color={theme.colors.textMuted} size={16} />
          <AppText color={theme.colors.textSoft} style={styles.metaCopy} variant="caption">
            {teacher
              ? [item.grupo ? `Grupo ${item.grupo}` : null, item.turno].filter(Boolean).join(' · ') || 'Carga academica'
              : item.docente || 'Docente por asignar'}
          </AppText>
        </View>
      </Card>
    </View>
  );
}

function ContactsSection({ student, teacher }: { student?: StudentSchedule; teacher?: TeacherSchedule }) {
  const teacherContacts = teacher?.contactos ?? [];
  const hasContacts = student?.contactos?.coordinador
    || student?.contactos?.auxiliar
    || teacherContacts.some((group) => group.coordinador || group.auxiliar);
  if (!hasContacts) return null;

  return (
    <View>
      <SectionTitle subtitle="Contactos asociados a tus grupos del ciclo" title="Equipo de acompanamiento" />
      {student?.contactos ? (
        <View style={styles.contactsGrid}>
          <ContactCard contact={student.contactos.coordinador} icon={UsersRound} label="Coordinador" />
          <ContactCard contact={student.contactos.auxiliar} icon={UserRound} label="Auxiliar" />
        </View>
      ) : null}
      {teacherContacts.map((group) => (
        <Card key={group.grupo_aula_id} style={styles.groupContacts}>
          <View style={styles.groupTitle}>
            <MapPinned color={theme.colors.accent} size={18} />
            <AppText variant="label">Grupo {group.grupo || group.grupo_aula_id}</AppText>
          </View>
          <View style={styles.contactsGridInner}>
            <ContactInline contact={group.coordinador} label="Coordinador" />
            <ContactInline contact={group.auxiliar} label="Auxiliar" />
          </View>
        </Card>
      ))}
    </View>
  );
}

function ContactCard({ contact, icon: Icon, label }: { contact?: Contact | null; icon: typeof UsersRound; label: string }) {
  return (
    <Card style={styles.contactCard}>
      <Icon color={theme.colors.accent} size={21} />
      <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
      <AppText numberOfLines={2} variant="label">{contact?.nombre || 'No asignado'}</AppText>
      <AppText color={theme.colors.textMuted} variant="caption">{contact?.telefono || 'Sin telefono'}</AppText>
    </Card>
  );
}

function ContactInline({ contact, label }: { contact?: Contact | null; label: string }) {
  return (
    <View style={styles.contactInline}>
      <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
      <AppText numberOfLines={1} variant="caption">{contact?.nombre || 'No asignado'}</AppText>
      {contact?.telefono ? <AppText color={theme.colors.accent} variant="micro">{contact.telefono}</AppText> : null}
    </View>
  );
}

function countClasses(blocks: ScheduleBlock[]) {
  return blocks.filter((block) => block.clase).length;
}

function defaultDay() {
  const jsDay = new Date().getDay();
  return jsDay >= 1 && jsDay <= 5 ? jsDay : 1;
}

function safeCourseColor(color: string | null | undefined, index: number) {
  if (color) {
    const normalized = color.startsWith('#') ? color : `#${color}`;
    if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized;
  }
  return [palette.lake600, palette.green700, palette.gold600, palette.violet700][index % 4];
}

const styles = StyleSheet.create({
  metricsRow: { flexDirection: 'row', gap: 9, marginHorizontal: 16 },
  dayPicker: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 4, marginHorizontal: 16, marginTop: 20, padding: 5, ...theme.shadow },
  dayButton: { alignItems: 'center', borderRadius: 13, flex: 1, gap: 5, justifyContent: 'center', minHeight: 52 },
  dayButtonActive: { backgroundColor: theme.colors.primary },
  dayDot: { backgroundColor: theme.colors.borderStrong, borderRadius: 3, height: 4, width: 15 },
  dayDotActive: { backgroundColor: '#72CFEF' },
  classRow: { flexDirection: 'row', marginHorizontal: 16 },
  timelineColumn: { alignItems: 'center', width: 24 },
  timelineDot: { borderColor: theme.colors.background, borderRadius: 8, borderWidth: 3, height: 16, marginTop: 22, width: 16 },
  timelineLine: { backgroundColor: theme.colors.borderStrong, flex: 1, width: 2 },
  classCard: { flex: 1, gap: 10, marginBottom: 12, marginHorizontal: 6 },
  classTop: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'space-between' },
  classMeta: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  metaCopy: { flex: 1 },
  breakRow: { flexDirection: 'row', marginHorizontal: 16, minHeight: 72 },
  breakDot: { alignItems: 'center', backgroundColor: theme.colors.warningSoft, borderRadius: 15, height: 30, justifyContent: 'center', marginTop: 10, width: 30 },
  breakCopy: { flex: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  contactsGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 16 },
  contactCard: { flex: 1, gap: 5, marginHorizontal: 0 },
  groupContacts: { gap: 12, marginBottom: 10 },
  groupTitle: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  contactsGridInner: { flexDirection: 'row', gap: 10 },
  contactInline: { backgroundColor: theme.colors.surfaceMuted, borderRadius: 13, flex: 1, gap: 3, padding: 10 },
  pressed: { opacity: 0.7 },
});
