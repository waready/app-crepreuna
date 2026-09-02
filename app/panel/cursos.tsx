import {
  BookOpenText,
  Building2,
  Check,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Phone,
  Search,
  Star,
  UserRound,
  UsersRound,
  Video,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthenticatedAvatar } from '@/components/ui/authenticated-avatar';
import {
  AppText,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
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
  CourseCriterion,
  StudentCourse,
  TeacherCourse,
  TeacherStudent,
} from '@/services/api-types';
import { periodLabel } from '@/utils/format';

export default function CoursesScreen() {
  const { role, period } = useSession();
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedStudentCourse, setSelectedStudentCourse] = useState<StudentCourse>();
  const [selectedTeacherCourse, setSelectedTeacherCourse] = useState<TeacherCourse>();

  const teacher = role === 'docente';

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
      if (teacher) setTeacherCourses(await api.teacher.courses());
      else setStudentCourses(await api.student.courses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los cursos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const search = query.trim().toLowerCase();
  const filteredStudent = studentCourses.filter((course) =>
    [course.curso, course.docente, course.grupo].some((value) => value?.toLowerCase().includes(search))
  );
  const filteredTeacher = teacherCourses.filter((course) =>
    [course.curso, course.grupo, course.modalidad, course.sede].some((value) => value?.toLowerCase().includes(search))
  );
  const presencial = teacherCourses.filter((course) => course.modalidad.toLowerCase() === 'presencial').length;
  const virtual = teacherCourses.filter((course) => course.modalidad.toLowerCase() === 'virtual').length;

  return (
    <Screen contentStyle={styles.screen} scroll={false}>
      <FlatList<StudentCourse | TeacherCourse>
        ListEmptyComponent={!loading && !error ? (
          <EmptyState
            icon={BookOpenText}
            message={search ? 'Prueba con otro nombre, grupo o docente.' : 'No existen cargas asignadas en el ciclo activo.'}
            title={search ? 'No encontramos coincidencias' : 'Sin cursos disponibles'}
          />
        ) : null}
        ListFooterComponent={<View style={styles.footerSpace} />}
        ListHeaderComponent={(
          <View>
            <PageHeader
              eyebrow={teacher ? 'Docencia' : 'Formacion academica'}
              period={periodLabel(period)}
              subtitle={teacher
                ? 'Distingue cada modalidad y consulta a tu equipo de grupo.'
                : 'Tus cursos, docentes y accesos del ciclo vigente.'}
              title="Mis cursos"
            />
            {teacher ? (
              <View style={styles.metricsRow}>
                <Metric icon={BookOpenText} label="Cargas activas" value={teacherCourses.length} />
                <Metric icon={Building2} label="Presenciales" tone="success" value={presencial} />
                <Metric icon={Video} label="Virtuales" tone="info" value={virtual} />
              </View>
            ) : null}
            <View style={styles.searchWrap}>
              <Field
                icon={Search}
                onChangeText={setQuery}
                placeholder="Buscar curso, grupo o docente"
                value={query}
              />
            </View>
            <SectionTitle
              subtitle={`${teacher ? filteredTeacher.length : filteredStudent.length} resultados del ciclo`}
              title={teacher ? 'Cargas academicas' : 'Cursos matriculados'}
            />
            {loading ? <LoadingState label="Consultando cargas academicas..." /> : null}
            {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        data={loading || error ? [] : teacher ? filteredTeacher : filteredStudent}
        keyExtractor={(item) => String(item.id)}
        onRefresh={() => load(true)}
        refreshing={refreshing}
        renderItem={({ item }) => teacher
          ? <TeacherCourseCard course={item as TeacherCourse} onOpen={() => setSelectedTeacherCourse(item as TeacherCourse)} />
          : <StudentCourseCard course={item as StudentCourse} onSurvey={() => setSelectedStudentCourse(item as StudentCourse)} />}
        showsVerticalScrollIndicator={false}
      />

      <SurveyModal
        course={selectedStudentCourse}
        onClose={() => setSelectedStudentCourse(undefined)}
        onCompleted={() => {
          setSelectedStudentCourse(undefined);
          void load();
        }}
      />
      <TeacherCourseModal
        course={selectedTeacherCourse}
        onClose={() => setSelectedTeacherCourse(undefined)}
        onUpdated={() => void load()}
      />
    </Screen>
  );
}

function StudentCourseCard({ course, onSurvey }: { course: StudentCourse; onSurvey: () => void }) {
  const color = safeCourseColor(course.color);
  const surveyAvailable = course.encuesta_habilitada && !course.encuesta_realizada;
  return (
    <Card style={styles.courseCard}>
      <View style={[styles.courseAccent, { backgroundColor: color }]} />
      <View style={styles.courseHeader}>
        <View style={[styles.courseIcon, { backgroundColor: `${color}1A` }]}>
          <BookOpenText color={color} size={22} />
        </View>
        <View style={styles.courseHeading}>
          <AppText variant="heading">{course.curso}</AppText>
          <View style={styles.pillRow}>
            {course.grupo ? <Pill label={`Grupo ${course.grupo}`} /> : null}
            {course.tipo ? <Pill label={course.tipo} tone="accent" /> : null}
          </View>
        </View>
      </View>
      <View style={styles.teacherRow}>
        <AuthenticatedAvatar name={course.docente || 'Docente por asignar'} size={42} />
        <View style={styles.teacherCopy}>
          <AppText color={theme.colors.textMuted} variant="micro">DOCENTE</AppText>
          <AppText numberOfLines={2} variant="label">{course.docente || 'Por asignar'}</AppText>
        </View>
      </View>
      <View style={styles.courseActions}>
        {course.meet_url ? (
          <Button compact icon={Video} label="Abrir Meet" onPress={() => void openUrl(course.meet_url)} variant="secondary" />
        ) : <Pill label="Meet no registrado" tone="neutral" />}
        {surveyAvailable ? (
          <Button compact icon={ClipboardCheck} label="Evaluar" onPress={onSurvey} />
        ) : course.encuesta_realizada ? (
          <Pill icon={Check} label="Evaluacion enviada" tone="success" />
        ) : null}
      </View>
    </Card>
  );
}

function TeacherCourseCard({ course, onOpen }: { course: TeacherCourse; onOpen: () => void }) {
  const virtual = course.modalidad.toLowerCase() === 'virtual';
  const color = safeCourseColor(course.color);
  return (
    <Card accessibilityLabel={`Abrir ${course.curso} ${course.grupo ?? ''}`} onPress={onOpen} style={styles.courseCard}>
      <View style={[styles.courseAccent, { backgroundColor: virtual ? theme.colors.info : theme.colors.success }]} />
      <View style={styles.teacherCourseTop}>
        <View style={[styles.courseIcon, { backgroundColor: `${color}1A` }]}>
          <BookOpenText color={color} size={22} />
        </View>
        <View style={styles.courseHeading}>
          <AppText variant="heading">{course.curso}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {course.grupo ? `Grupo ${course.grupo}` : 'Grupo no indicado'}
          </AppText>
        </View>
        <Pill
          icon={virtual ? Video : Building2}
          label={course.modalidad}
          tone={virtual ? 'info' : 'success'}
        />
      </View>
      <View style={styles.locationRow}>
        <MapPin color={theme.colors.textMuted} size={17} />
        <AppText color={theme.colors.textSoft} style={styles.locationCopy} variant="caption">
          {[course.sede, course.local, course.aula ? `Aula ${course.aula}` : null].filter(Boolean).join(' · ') || 'Ubicacion por confirmar'}
        </AppText>
      </View>
      <Divider />
      <View style={styles.contactSummary}>
        <ContactMini icon={UsersRound} label="Coordinador" value={course.coordinador?.nombre} />
        <ContactMini icon={UserRound} label="Auxiliar" value={course.auxiliar?.nombre} />
      </View>
      <View style={styles.openHint}>
        <AppText color={theme.colors.accent} variant="label">Ver detalles y estudiantes</AppText>
        <ExternalLink color={theme.colors.accent} size={17} />
      </View>
    </Card>
  );
}

function ContactMini({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value?: string | null }) {
  return (
    <View style={styles.contactMini}>
      <Icon color={theme.colors.accent} size={17} />
      <View style={styles.contactMiniCopy}>
        <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
        <AppText numberOfLines={1} variant="caption">{value || 'No asignado'}</AppText>
      </View>
    </View>
  );
}

function SurveyModal({
  course,
  onClose,
  onCompleted,
}: {
  course?: StudentCourse;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [criteria, setCriteria] = useState<CourseCriterion[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!course) return;
    setScores({});
    setLoading(true);
    setError('');
    api.student.criteria(course.id)
      .then(setCriteria)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'No se pudo cargar la evaluacion.'))
      .finally(() => setLoading(false));
  }, [course]);

  async function submit() {
    if (!course) return;
    if (criteria.some((criterion) => !scores[criterion.id])) {
      setError('Responde todos los criterios antes de enviar.');
      return;
    }
    setSending(true);
    try {
      await api.student.rateTeacher(course.id, criteria.map((criterion) => ({
        criterio_id: criterion.id,
        puntaje: scores[criterion.id],
      })));
      Alert.alert('Evaluacion enviada', 'Gracias por completar todos los criterios.');
      onCompleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la evaluacion.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={Boolean(course)}>
      <View style={styles.modalScrim}>
        <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <View style={styles.modalTitleCopy}>
              <AppText variant="title">Evaluar docente</AppText>
              <AppText color={theme.colors.textMuted} variant="caption">{course?.curso} · {course?.docente}</AppText>
            </View>
            <IconButton accessibilityLabel="Cerrar" icon={X} onPress={onClose} />
          </View>
          {loading ? <LoadingState label="Cargando criterios..." /> : null}
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {criteria.map((criterion, index) => (
              <View key={criterion.id} style={styles.criterion}>
                <AppText variant="label">{index + 1}. {criterion.denominacion}</AppText>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((score) => {
                    const active = score <= (scores[criterion.id] || 0);
                    return (
                      <Pressable
                        accessibilityLabel={`${score} estrellas`}
                        key={score}
                        onPress={() => setScores((current) => ({ ...current, [criterion.id]: score }))}
                        style={styles.starButton}>
                        <Star
                          color={active ? theme.colors.warning : theme.colors.borderStrong}
                          fill={active ? theme.colors.warning : 'transparent'}
                          size={27}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            {error ? <AppText color={theme.colors.danger} style={styles.modalError} variant="caption">{error}</AppText> : null}
            {!loading ? (
              <Button fullWidth label="Enviar evaluacion" loading={sending} onPress={submit} />
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function TeacherCourseModal({
  course,
  onClose,
  onUpdated,
}: {
  course?: TeacherCourse;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { height } = useWindowDimensions();
  const [meet, setMeet] = useState('');
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMeet(course?.meet_url || '');
    setStudents([]);
    setError('');
  }, [course]);

  async function loadStudents() {
    if (!course || loadingStudents) return;
    setLoadingStudents(true);
    setError('');
    try {
      setStudents(await api.teacher.students(course.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar la lista.');
    } finally {
      setLoadingStudents(false);
    }
  }

  async function saveMeet() {
    if (!course || !/^https?:\/\//i.test(meet.trim())) {
      setError('Ingresa un enlace completo que empiece con http:// o https://.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.teacher.updateMeet(course.id, meet.trim());
      Alert.alert('Meet actualizado', 'El enlace ya esta disponible para tus estudiantes.');
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo actualizar Meet.');
    } finally {
      setSaving(false);
    }
  }

  if (!course) return null;
  const virtual = course.modalidad.toLowerCase() === 'virtual';

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible>
      <View style={styles.modalScrim}>
        <SafeAreaView edges={['bottom']} style={[styles.modalSheet, { maxHeight: height * 0.9 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <View style={styles.modalTitleCopy}>
              <Pill icon={virtual ? Video : Building2} label={course.modalidad} tone={virtual ? 'info' : 'success'} />
              <AppText variant="title">{course.curso}</AppText>
              <AppText color={theme.colors.textMuted} variant="caption">Grupo {course.grupo || 'sin asignar'}</AppText>
            </View>
            <IconButton accessibilityLabel="Cerrar" icon={X} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Card style={styles.locationCard}>
              <MapPin color={theme.colors.accent} size={21} />
              <View style={styles.locationCopy}>
                <AppText variant="label">{course.sede || course.local || 'Ubicacion por confirmar'}</AppText>
                <AppText color={theme.colors.textMuted} variant="caption">
                  {[course.direccion, course.aula ? `Aula ${course.aula}` : null].filter(Boolean).join(' · ') || 'Sin direccion registrada'}
                </AppText>
              </View>
            </Card>

            <SectionTitle title="Equipo del grupo" />
            <ContactCard contact={course.coordinador} label="Coordinador" />
            <ContactCard contact={course.auxiliar} label="Auxiliar" />

            <SectionTitle subtitle="El cambio se refleja para tus estudiantes" title="Enlace de clase" />
            <Field icon={Video} label="URL de Google Meet" onChangeText={setMeet} placeholder="https://meet.google.com/..." value={meet} />
            <View style={styles.inlineActions}>
              {course.meet_url ? <Button compact icon={ExternalLink} label="Abrir" onPress={() => void openUrl(course.meet_url)} variant="secondary" /> : null}
              <Button compact icon={Check} label="Guardar Meet" loading={saving} onPress={saveMeet} />
            </View>

            <SectionTitle
              action={<Button compact icon={UsersRound} label={students.length ? 'Actualizar' : 'Ver lista'} loading={loadingStudents} onPress={loadStudents} variant="soft" />}
              subtitle="Solo estudiantes matriculados en este grupo"
              title="Estudiantes"
            />
            {students.map((student, index) => (
              <View key={student.id} style={styles.studentRow}>
                <View style={styles.studentNumber}>
                  <AppText color={theme.colors.primary} variant="micro">{index + 1}</AppText>
                </View>
                <View style={styles.studentCopy}>
                  <AppText variant="label">{student.nombre_completo}</AppText>
                  <AppText color={theme.colors.textMuted} variant="micro">{student.nro_documento || student.usuario || 'Sin documento'}</AppText>
                </View>
              </View>
            ))}
            {error ? <AppText color={theme.colors.danger} style={styles.modalError} variant="caption">{error}</AppText> : null}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function ContactCard({ contact, label }: { contact?: TeacherCourse['coordinador']; label: string }) {
  return (
    <Card style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        {label === 'Coordinador'
          ? <UsersRound color={theme.colors.primary} size={21} />
          : <UserRound color={theme.colors.primary} size={21} />}
      </View>
      <View style={styles.contactCardCopy}>
        <AppText color={theme.colors.textMuted} variant="micro">{label.toUpperCase()}</AppText>
        <AppText variant="label">{contact?.nombre || 'No asignado'}</AppText>
        <AppText color={theme.colors.textMuted} variant="caption">{contact?.telefono || 'Telefono no registrado'}</AppText>
      </View>
      {contact?.telefono ? (
        <IconButton accessibilityLabel={`Llamar a ${label}`} icon={Phone} onPress={() => void Linking.openURL(`tel:${contact.telefono}`)} />
      ) : null}
    </Card>
  );
}

async function openUrl(url?: string | null) {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Enlace no disponible', 'No se pudo abrir este enlace.');
  }
}

function safeCourseColor(color?: string | null) {
  if (!color) return theme.colors.accent;
  const normalized = color.startsWith('#') ? color : `#${color}`;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : theme.colors.accent;
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  listContent: { flexGrow: 1 },
  metricsRow: { flexDirection: 'row', gap: 9, marginBottom: 18, marginHorizontal: 16 },
  searchWrap: { marginHorizontal: 16 },
  courseCard: { gap: 14, marginBottom: 12, overflow: 'hidden', paddingTop: 18 },
  courseAccent: { height: 4, left: 0, position: 'absolute', right: 0, top: 0 },
  courseHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  courseIcon: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  courseHeading: { flex: 1, gap: 5 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  teacherRow: { alignItems: 'center', backgroundColor: theme.colors.surfaceMuted, borderRadius: 14, flexDirection: 'row', gap: 10, padding: 10 },
  teacherCopy: { flex: 1 },
  courseActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  teacherCourseTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  locationRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  locationCopy: { flex: 1 },
  contactSummary: { flexDirection: 'row', gap: 10 },
  contactMini: { alignItems: 'flex-start', flex: 1, flexDirection: 'row', gap: 7 },
  contactMiniCopy: { flex: 1 },
  openHint: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  footerSpace: { height: 105 },
  modalScrim: { backgroundColor: palette.scrim, flex: 1, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', minHeight: '56%', overflow: 'hidden' },
  modalHandle: { alignSelf: 'center', backgroundColor: theme.colors.borderStrong, borderRadius: 3, height: 5, marginTop: 9, width: 46 },
  modalTitleRow: { alignItems: 'flex-start', borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 14, justifyContent: 'space-between', padding: 18 },
  modalTitleCopy: { flex: 1, gap: 5 },
  modalScroll: { gap: 12, paddingBottom: 40, paddingTop: 14 },
  criterion: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: 16, borderWidth: 1, gap: 12, marginHorizontal: 16, padding: 14 },
  stars: { flexDirection: 'row', justifyContent: 'space-between' },
  starButton: { alignItems: 'center', height: 42, justifyContent: 'center', width: 44 },
  modalError: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, marginHorizontal: 16, padding: 11 },
  locationCard: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  contactCard: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 0 },
  contactAvatar: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  contactCardCopy: { flex: 1 },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', marginHorizontal: 16 },
  studentRow: { alignItems: 'center', backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 10, marginHorizontal: 16, padding: 11 },
  studentNumber: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  studentCopy: { flex: 1 },
});
