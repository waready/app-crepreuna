import { BookMarked, ChevronDown, ChevronRight, Download, FileText, LibraryBig, Video } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardSkeleton, ListSkeleton } from '@/components/ui/skeleton';
import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { normalizeRepoBookletCategories, normalizeRepoTemarios } from '@/services/cepreuna-mappers';
import { findArray, pickString } from '@/services/normalizers';

type CourseTab = 'mis-cursos' | 'guias' | 'temarios';

const fallbackCourses = [
  { name: 'Razonamiento Matematico', teacher: 'Mg. Carlos Quispe', progress: 'En curso', color: '#006CAF', link: '', classroom: '', condition: 'Titular' },
  { name: 'Comunicacion', teacher: 'Lic. Ana Mamani', progress: 'En curso', color: '#0F7A59', link: '', classroom: '', condition: 'Titular' },
  { name: 'Biologia', teacher: 'Dra. Rosa Flores', progress: 'En curso', color: '#BF211E', link: '', classroom: '', condition: 'Titular' },
];

const fallbackBookletCategories = [
  {
    denominacion: 'General',
    color: '#006CAF',
    semanas: [
      { semana: '01', cuadernillos: [{ id: '1', nombre: 'Introduccion y diagnostico', descripcion: '', archivoUrl: '', fecha: '' }] },
      { semana: '02', cuadernillos: [{ id: '2', nombre: 'Practica dirigida', descripcion: '', archivoUrl: '', fecha: '' }] },
      { semana: '03', cuadernillos: [{ id: '3', nombre: 'Banco de ejercicios', descripcion: '', archivoUrl: '', fecha: '' }] },
    ],
  },
];


const fallbackTemarios = normalizeTemariosFallback({
  temarios: [
    { id: 24, area: 'Ingenierias', curso: 'Aritmetica', color: '#A8D7F9', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163212qurD.pdf', id: 16 } },
    { id: 25, area: 'Ingenierias', curso: 'Algebra', color: '#C8EDFF', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163358cnD6.pdf', id: 17 } },
    { id: 26, area: 'Ingenierias', curso: 'Geometria', color: '#E8C4C4', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163459rCsT.pdf', id: 18 } },
    { id: 27, area: 'Ingenierias', curso: 'Trigonometria', color: '#EADA19', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163540RqN6.pdf', id: 19 } },
    { id: 9, area: 'Ingenierias', curso: 'Fisica', color: '#80cbc4', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163616WElT.pdf', id: 20 } },
    { id: 10, area: 'Ingenierias', curso: 'Quimica', color: '#dcedc8', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_1637021JG6.pdf', id: 21 } },
    { id: 32, area: 'Ingenierias', curso: 'Biologia y Anatomia', color: '#19EA85', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163727Q3Ly.pdf', id: 22 } },
    { id: 7, area: 'Ingenierias', curso: 'Psicologia y Filosofia', color: '#f8bbd0', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163752xALT.pdf', id: 23 } },
    { id: 21, area: 'Ingenierias', curso: 'Educacion Civica', color: '#e1bee7', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_163901y7Tw.pdf', id: 24 } },
    { id: 8, area: 'Ingenierias', curso: 'Economia', color: '#c5cae9', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_164042YUAy.pdf', id: 25 } },
    { id: 29, area: 'Ingenierias', curso: 'Comunicacion y Literatura', color: '#BEC6F7', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_164143OCJ4.pdf', id: 26 } },
    { id: 12, area: 'Ingenierias', curso: 'Razonamiento Matematico', color: '#d7ccc8', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_1642050vPV.pdf', id: 27 } },
    { id: 11, area: 'Ingenierias', curso: 'Razonamiento Verbal', color: '#ffe082', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260323_091131brPB.pdf', id: 45 } },
    { id: 36, area: 'Ingenierias', curso: 'Historia y Geografia', color: '#F99F3B', base_path: 'https://sistemas.cepreuna.edu.pe', temarios: { path: '03-2026/Temario-20260321_164232zxjT.pdf', id: 28 } },
  ],
});

export default function CoursesScreen() {
  const [tab, setTab] = useState<CourseTab>('mis-cursos');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const loadCourses = useCallback(() => api.getCarga(), []);
  const loadBooklets = useCallback(() => api.getCuadernillos(), []);
  const loadTemarios = useCallback(() => api.getTemarios(), []);
  const coursesResource = useApiResource(loadCourses);
  const bookletsResource = useApiResource(loadBooklets);
  const temariosResource = useApiResource(loadTemarios, tab === 'temarios');
  const apiCourses = useMemo(() => normalizeCourses(coursesResource.data), [coursesResource.data]);
  const apiBooklets = useMemo(() => normalizeRepoBookletCategories(bookletsResource.data), [bookletsResource.data]);
  const apiTemarios = useMemo(() => normalizeRepoTemarios(temariosResource.data), [temariosResource.data]);
  const courses = apiCourses.length ? apiCourses : fallbackCourses;
  const bookletCategories = apiBooklets.length ? apiBooklets : fallbackBookletCategories;
  const temarios = apiTemarios.length ? apiTemarios : fallbackTemarios;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Academico</Text>
          <Text style={styles.title}>Cursos</Text>
          <Text style={styles.subtitle}>Mis cursos, guias de aprendizaje y temarios conectados a tu carga academica.</Text>
        </View>

        <View style={styles.tabsCard}>
          <View style={styles.menuTitleRow}>
            <LibraryBig color="#F27A1A" size={22} />
            <Text style={styles.menuTitle}>Cursos</Text>
          </View>
          <View style={styles.tabs}>
            <TabButton active={tab === 'mis-cursos'} label="Mis Cursos" onPress={() => setTab('mis-cursos')} />
            <TabButton active={tab === 'guias'} label="Guias" onPress={() => setTab('guias')} />
            <TabButton active={tab === 'temarios'} label="Temarios" onPress={() => setTab('temarios')} />
          </View>
        </View>

        {coursesResource.error ? <Text style={styles.errorText}>Modo demo: {coursesResource.error}</Text> : null}
        {tab === 'mis-cursos' ? (
          <>
            <SectionTitle title="Mis cursos" action={coursesResource.loading ? 'Cargando...' : 'Actualizar'} />
            <View style={styles.courseList}>
              {coursesResource.loading && !apiCourses.length ? <ListSkeleton count={2} /> : null}
              {(!coursesResource.loading || apiCourses.length ? courses : []).map((course) => (
                <CourseCard
                  key={course.name}
                  course={course}
                  expanded={expandedCourse === course.name}
                  onToggle={() => setExpandedCourse((current) => current === course.name ? null : course.name)}
                />
              ))}
            </View>
          </>
        ) : null}

        {tab === 'temarios' ? (
          <>
            <SectionTitle title="Temarios" action={temariosResource.loading && !apiTemarios.length ? 'Cargando...' : `${temarios.length} archivos`} />
            {temariosResource.error && !apiTemarios.length ? <Text style={styles.infoText}>Vista previa con datos de ejemplo. Cuando el backend exponga /api/temarios, se reemplazara automaticamente.</Text> : null}
            <View style={styles.resourceList}>
              {temariosResource.loading && !apiTemarios.length ? <ListSkeleton count={3} /> : null}
              {temarios.map((temario) => (
                <ResourceCard
                  key={`${temario.courseId}-${temario.id}`}
                  color={temario.color}
                  icon="topic"
                  title={temario.course}
                  subtitle={`${temario.area} ? Temario PDF`}
                  actionLabel={temario.archivoUrl ? 'Abrir PDF' : 'Sin PDF'}
                  onPress={temario.archivoUrl ? () => Linking.openURL(temario.archivoUrl) : undefined}
                />
              ))}
            </View>
          </>
        ) : null}

        {tab === 'guias' ? <SectionTitle title="Guias de aprendizaje" action={bookletsResource.loading ? 'Cargando...' : `${bookletCategories.length} cursos`} /> : null}
        {tab === 'guias' && bookletsResource.error ? <Text style={styles.errorText}>Modo demo: {bookletsResource.error}</Text> : null}
        {tab === 'guias' ? <View style={styles.bookletList}>
          {bookletsResource.loading && !apiBooklets.length ? (
            <>
              <CardSkeleton rows={3} />
              <CardSkeleton rows={3} />
            </>
          ) : null}
          {(!bookletsResource.loading || apiBooklets.length ? bookletCategories : []).map((category) => (
            <View key={category.denominacion} style={[styles.categoryCard, { borderLeftColor: category.color }]}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.denominacion}</Text>
                <Text style={styles.categoryCount}>{category.semanas.length} semanas</Text>
              </View>
              {category.semanas.slice(0, 5).map((week) => {
                const firstBooklet = week.cuadernillos[0];
                return (
                  <Pressable
                    key={`${category.denominacion}-${week.semana}`}
                    style={styles.bookletItem}
                    onPress={() => firstBooklet?.archivoUrl && Linking.openURL(firstBooklet.archivoUrl)}>
                    <View style={styles.bookletIcon}>
                      <FileText color="#00365A" size={22} />
                    </View>
                    <View style={styles.bookletCopy}>
                      <Text style={styles.bookletWeek}>Semana {week.semana}</Text>
                      <Text style={styles.bookletTitle}>{firstBooklet?.nombre ?? `Guia semana ${week.semana}`}</Text>
                      <Text style={styles.bookletArea}>{week.cuadernillos.length} archivo(s)</Text>
                    </View>
                    <View style={styles.downloadButton}>
                      <Download color="#ffffff" size={18} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}


function normalizeTemariosFallback(data: unknown) {
  const rows = data && typeof data === 'object' && Array.isArray((data as { temarios?: unknown }).temarios)
    ? ((data as { temarios: Record<string, unknown>[] }).temarios)
    : [];

  return rows.map((item) => {
    const temario = item.temarios && typeof item.temarios === 'object' ? (item.temarios as Record<string, unknown>) : {};
    const basePath = pickString(item, ['base_path'], 'https://sistemas.cepreuna.edu.pe');
    const path = pickString(temario, ['path'], '');
    return {
      id: pickString(temario, ['id'], pickString(item, ['id'], '0')),
      courseId: pickString(item, ['id'], '0'),
      area: pickString(item, ['area'], 'Area academica'),
      course: pickString(item, ['curso'], 'Curso CEPREUNA'),
      color: pickString(item, ['color'], '#006CAF'),
      archivoUrl: path ? `${basePath.replace(/\/+$/, '')}/storage/documentos/${path.replace(/^\/+/, '')}` : '',
    };
  });
}

function normalizeCourses(data: unknown) {
  const seen = new Set<string>();

  return findArray(data, ['carga', 'cargas', 'cursos', 'mis_cursos', 'data']).map((item, index) => {
    const curso = item.curso && typeof item.curso === 'object' ? (item.curso as Record<string, unknown>) : item;
    const docente = item.docente && typeof item.docente === 'object' ? (item.docente as Record<string, unknown>) : {};
    const docenteNombre = [
      pickString(docente, ['paterno'], ''),
      pickString(docente, ['materno'], ''),
      pickString(docente, ['nombres', 'name'], ''),
    ].filter(Boolean).join(' ');
    const name = pickString(curso, ['denominacion', 'curso', 'nombre', 'asignatura'], 'Curso CEPREUNA');
    const key = `${name}-${docenteNombre}-${pickString(item, ['idclassroom'], '')}`;
    if (seen.has(key)) {
      return null;
    }
    seen.add(key);

    return {
      name,
      teacher: docenteNombre || pickString(item, ['profesor', 'teacher'], 'Docente asignado'),
      progress: pickString(item, ['estado_label', 'progress', 'situacion'], pickString(item, ['estado'], 'En curso') === '1' ? 'En curso' : 'Disponible'),
      color: pickString(curso, ['color'], ['#006CAF', '#0F7A59', '#BF211E', '#7A4E00'][index % 4]),
      link: pickString(item, ['link', 'url'], ''),
      classroom: pickString(item, ['idclassroom'], ''),
      condition: pickString(docente, ['condicion'], 'Titular'),
    };
  }).filter((course): course is NonNullable<typeof course> => Boolean(course));
}


function CourseCard({
  course,
  expanded,
  onToggle,
}: {
  course: ReturnType<typeof normalizeCourses>[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.accordionCard}>
      <Pressable style={styles.accordionHeader} onPress={onToggle}>
        <View style={[styles.bookmark, { backgroundColor: course.color }]} />
        <Text style={styles.accordionTitle}>{course.name}</Text>
        <ChevronDown color="#45525d" size={18} style={expanded ? styles.chevronOpen : undefined} />
      </Pressable>
      {expanded ? (
        <View style={styles.accordionBody}>
          <InfoLine label="Docente" value={course.teacher} />
          <InfoLine label="Condicion" value={course.condition} />
          <View style={styles.actionLine}>
            <Text style={styles.infoLabel}>Meet:</Text>
            <Pressable
              style={[styles.meetButton, !course.link && styles.meetButtonDisabled]}
              onPress={() => course.link && Linking.openURL(course.link)}
              disabled={!course.link}>
              <Video color="#ffffff" size={14} />
              <Text style={styles.meetText}>{course.link ? 'Ir a Meet' : 'Sin enlace'}</Text>
            </Pressable>
          </View>
          <InfoLine label="Encuesta" value={course.classroom ? `Classroom ${course.classroom}` : 'Pendiente'} />
        </View>
      ) : null}
    </View>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}


function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ResourceCard({
  color,
  icon,
  title,
  subtitle,
  actionLabel,
  onPress,
}: {
  color: string;
  icon: 'guide' | 'topic';
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress?: () => void;
}) {
  const Icon = icon === 'guide' ? BookMarked : FileText;

  return (
    <Pressable style={styles.resourceCard} onPress={onPress} disabled={!onPress}>
      <View style={[styles.resourceIcon, { backgroundColor: `${color}33` }]}>
        <Icon color={color} size={22} />
      </View>
      <View style={styles.resourceCopy}>
        <Text style={styles.resourceTitle}>{title}</Text>
        <Text style={styles.resourceText}>{subtitle}</Text>
      </View>
      <View style={[styles.resourceAction, !onPress && styles.resourceActionDisabled]}>
        <Text style={styles.resourceActionText}>{actionLabel}</Text>
        <ChevronRight color="#ffffff" size={15} />
      </View>
    </Pressable>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Text style={styles.sectionAction}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: {
    backgroundColor: '#00365A',
    borderRadius: 8,
    padding: 18,
  },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 29, fontWeight: '900', letterSpacing: 0, lineHeight: 32, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { color: '#00365A', fontSize: 20, fontWeight: '900' },
  sectionAction: { color: '#006CAF', fontSize: 13, fontWeight: '900' },
  tabsCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 12, padding: 13 },
  menuTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  menuTitle: { color: '#F27A1A', fontSize: 19, fontWeight: '800' },
  tabs: { backgroundColor: '#eef4f8', borderRadius: 8, flexDirection: 'row', gap: 5, padding: 5 },
  tabButton: { alignItems: 'center', borderRadius: 7, flex: 1, justifyContent: 'center', minHeight: 40 },
  tabButtonActive: { backgroundColor: '#00365A', boxShadow: '0px 5px 14px rgba(0, 28, 48, 0.12)' },
  tabText: { color: '#687784', fontSize: 11, fontWeight: '900' },
  tabTextActive: { color: '#ffffff' },
  courseList: { gap: 10 },
  accordionCard: { backgroundColor: '#ffffff', borderColor: '#d6dee5', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  accordionHeader: { alignItems: 'center', backgroundColor: '#f8fafc', flexDirection: 'row', gap: 9, minHeight: 50, paddingHorizontal: 14 },
  bookmark: { borderBottomLeftRadius: 2, borderBottomRightRadius: 2, height: 25, width: 17 },
  accordionTitle: { color: '#263846', flex: 1, fontSize: 15, fontWeight: '900' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  accordionBody: { backgroundColor: '#ffffff', gap: 12, padding: 16, paddingLeft: 24 },
  infoLine: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  infoLabel: { color: '#2e3b45', fontSize: 13, fontWeight: '900' },
  infoValue: { color: '#344856', flex: 1, fontSize: 13, letterSpacing: 0.5 },
  actionLine: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  meetButton: { alignItems: 'center', backgroundColor: '#1D8AE5', borderRadius: 5, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  meetButtonDisabled: { backgroundColor: '#8ba0ad' },
  meetText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  courseCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e1ebf2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  courseStripe: { width: 5 },
  courseBody: { flex: 1, padding: 15 },
  courseTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  courseIcon: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  progress: { color: '#00365A', fontSize: 19, fontWeight: '900' },
  courseTitle: { color: '#00365A', fontSize: 17, fontWeight: '900', marginTop: 12 },
  courseTeacher: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 4 },
  classroomText: { color: '#006CAF', fontSize: 11, fontWeight: '900', marginTop: 7 },
  resourceList: { gap: 10 },
  resourceCard: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 13 },
  resourceIcon: { alignItems: 'center', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  resourceCopy: { flex: 1 },
  resourceTitle: { color: '#00365A', fontSize: 15, fontWeight: '900' },
  resourceText: { color: '#687784', fontSize: 12, lineHeight: 17, marginTop: 2 },
  resourceAction: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 3, paddingHorizontal: 8, paddingVertical: 8 },
  resourceActionDisabled: { backgroundColor: '#8ba0ad' },
  resourceActionText: { color: '#ffffff', fontSize: 10, fontWeight: '900' },
  scheduleCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, padding: 8 },
  scheduleItem: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 9 },
  scheduleIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 40, justifyContent: 'center', width: 40 },
  scheduleCopy: { flex: 1 },
  scheduleDay: { color: '#00365A', fontSize: 14, fontWeight: '900' },
  scheduleCourse: { color: '#687784', fontSize: 12, marginTop: 2 },
  timePill: { alignItems: 'center', backgroundColor: '#eef7fc', borderRadius: 8, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 7 },
  timeText: { color: '#006CAF', fontSize: 10, fontWeight: '900' },
  bookletList: { gap: 10 },
  categoryCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderLeftWidth: 5, borderRadius: 8, borderWidth: 1, gap: 8, padding: 12 },
  categoryHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  categoryTitle: { color: '#00365A', flex: 1, fontSize: 17, fontWeight: '900' },
  categoryCount: { color: '#006CAF', fontSize: 11, fontWeight: '900' },
  bookletItem: { alignItems: 'center', backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 13 },
  bookletIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  bookletCopy: { flex: 1 },
  bookletWeek: { color: '#006CAF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  bookletTitle: { color: '#00365A', fontSize: 15, fontWeight: '900', marginTop: 2 },
  bookletArea: { color: '#687784', fontSize: 12, marginTop: 2 },
  downloadButton: { alignItems: 'center', backgroundColor: '#00365A', borderRadius: 8, height: 40, justifyContent: 'center', width: 40 },
  liveCard: { alignItems: 'center', backgroundColor: '#0F7A59', borderRadius: 8, flexDirection: 'row', gap: 12, padding: 16 },
  liveIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, height: 48, justifyContent: 'center', width: 48 },
  liveCopy: { flex: 1 },
  liveTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  liveText: { color: '#e0f6ed', fontSize: 12, lineHeight: 18, marginTop: 3 },
  infoText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});

