import { router } from 'expo-router';
import {
  BookOpenText,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  Files,
  Layers3,
  UsersRound,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Card,
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
import { periodLabel } from '@/utils/format';

type ResourceCounts = { courses: number; sessions: number; questions: number };

export default function TeacherResourcesScreen() {
  const { period } = useSession();
  const [counts, setCounts] = useState<ResourceCounts>({ courses: 0, sessions: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [courses, sessions, questions] = await Promise.all([
        api.teacher.courses(),
        api.teacher.sessions(),
        api.teacher.questionBatches(),
      ]);
      setCounts({ courses: courses.length, sessions: sessions.length, questions: questions.length });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el resumen docente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        eyebrow="Espacio docente"
        period={periodLabel(period)}
        subtitle="Planifica tus clases y administra entregables del ciclo vigente."
        title="Recursos"
      />
      <View style={styles.metrics}>
        <Metric icon={Layers3} label="Cargas" value={counts.courses} />
        <Metric icon={ClipboardList} label="Sesiones" tone="success" value={counts.sessions} />
        <Metric icon={FileQuestion} label="Entregas" tone="warning" value={counts.questions} />
      </View>
      <View style={styles.content}>
        {loading ? <LoadingState label="Preparando tus recursos..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {!loading && !error ? (
          <>
            <SectionTitle subtitle="Herramientas asignadas a tu rol" title="Gestion academica" />
            <ResourceCard
              accent={theme.colors.success}
              description="Registra fecha, semana y tema dictado por cada carga academica."
              icon={ClipboardList}
              label={`${counts.sessions} registradas`}
              onPress={() => router.push('/panel/sesiones')}
              title="Sesiones de aprendizaje"
            />
            <ResourceCard
              accent={theme.colors.warning}
              description="Descarga la plantilla y envia las dos preguntas semanales en Word."
              icon={FileQuestion}
              label={`${counts.questions} entregas`}
              onPress={() => router.push('/panel/preguntas')}
              title="Banco de preguntas"
            />
            <ResourceCard
              accent={theme.colors.accent}
              description="Consulta cuadernillos y temarios oficiales protegidos por tu cuenta."
              icon={Files}
              label="Biblioteca"
              onPress={() => router.push('/panel/materiales')}
              title="Materiales academicos"
            />
            <SectionTitle subtitle="Accesos frecuentes" title="Seguimiento" />
            <View style={styles.quickGrid}>
              <QuickCard icon={BookOpenText} label="Mis cursos" onPress={() => router.push('/panel/cursos')} />
              <QuickCard icon={CalendarCheck} label="Asistencia" onPress={() => router.push('/panel/asistencia')} />
              <QuickCard icon={UsersRound} label="Estudiantes" onPress={() => router.push('/panel/cursos')} />
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function ResourceCard({
  icon: Icon,
  title,
  description,
  label,
  accent,
  onPress,
}: {
  icon: typeof ClipboardList;
  title: string;
  description: string;
  label: string;
  accent: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.resourceCard}>
      <View style={[styles.resourceAccent, { backgroundColor: accent }]} />
      <View style={[styles.resourceIcon, { backgroundColor: `${accent}18` }]}>
        <Icon color={accent} size={27} />
      </View>
      <View style={styles.resourceCopy}>
        <View style={styles.resourceTitleRow}>
          <AppText variant="heading">{title}</AppText>
          <Pill label={label} />
        </View>
        <AppText color={theme.colors.textMuted} variant="caption">{description}</AppText>
      </View>
      <ChevronRight color={theme.colors.textMuted} size={21} />
    </Card>
  );
}

function QuickCard({ icon: Icon, label, onPress }: { icon: typeof BookOpenText; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <View style={styles.quickIcon}><Icon color={palette.paper} size={21} /></View>
      <AppText color={theme.colors.primary} style={styles.quickLabel} variant="label">{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 9, marginHorizontal: 16 },
  content: { gap: 13, paddingHorizontal: 16, paddingTop: 20 },
  resourceCard: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 0, overflow: 'hidden', paddingLeft: 19 },
  resourceAccent: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 5 },
  resourceIcon: { alignItems: 'center', borderRadius: 17, height: 56, justifyContent: 'center', width: 56 },
  resourceCopy: { flex: 1, gap: 6 },
  resourceTitleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  quickGrid: { flexDirection: 'row', gap: 9 },
  quick: { alignItems: 'center', backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1, flex: 1, gap: 8, minHeight: 105, padding: 10 },
  quickIcon: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  quickLabel: { textAlign: 'center' },
  pressed: { opacity: 0.78 },
});
