import {
  Award,
  BrainCircuit,
  Check,
  CircleHelp,
  Download,
  Send,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Metric,
  PageHeader,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { VocationalQuestion, VocationalTest } from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { formatDate, periodLabel } from '@/utils/format';

export default function VocationalTestScreen() {
  const { period } = useSession();
  const [data, setData] = useState<VocationalTest>();
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      setData(await api.student.test());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el test vocacional.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function submit() {
    if (!data) return;
    if (data.preguntas.some((question) => answers[question.id] === undefined)) {
      setError('Responde todas las preguntas antes de enviar.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.student.submitTest(data.preguntas.map((question) => ({
        pregunta_id: question.id,
        respuesta: answers[question.id],
      })));
      Alert.alert('Test completado', 'Tu resultado vocacional ya esta disponible.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron guardar tus respuestas.');
    } finally {
      setSending(false);
    }
  }

  async function certificate() {
    try {
      await downloadAuthenticatedFile(api.student.testCertificateUrl(), 'resultado-test-vocacional.pdf');
    } catch (caught) {
      Alert.alert('No se pudo abrir', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }

  const answered = Object.keys(answers).length;

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow="Orientacion academica"
        period={periodLabel(period)}
        subtitle="Descubre el campo profesional que mejor conecta con tus intereses."
        title="Test vocacional"
      />
      <View style={styles.content}>
        {loading ? <LoadingState label="Preparando tu evaluacion..." /> : null}
        {error && !data ? <ErrorState message={error} onRetry={() => load()} /> : null}

        {!loading && data?.respondido && data.resultado ? (
          <Result data={data} onCertificate={() => void certificate()} />
        ) : null}

        {!loading && data && !data.respondido && data.estado !== 'activo' ? (
          <EmptyState
            icon={BrainCircuit}
            message={data.estado === 'proximamente'
              ? 'La evaluacion todavia no fue habilitada para el ciclo activo.'
              : 'El periodo de evaluacion vocacional ha finalizado.'}
            title={data.estado === 'proximamente' ? 'Disponible proximamente' : 'Evaluacion cerrada'}
          />
        ) : null}

        {!loading && data && !data.respondido && data.estado === 'activo' ? (
          <>
            <Card style={styles.introCard}>
              <View style={styles.introIcon}><Sparkles color={theme.colors.warning} size={25} /></View>
              <View style={styles.introCopy}>
                <AppText variant="heading">Responde con sinceridad</AppText>
                <AppText color={theme.colors.textMuted} variant="caption">
                  No existen respuestas correctas. Marca Si o No segun tus preferencias personales.
                </AppText>
              </View>
            </Card>
            <View style={styles.metrics}>
              <Metric icon={CircleHelp} label="Preguntas" value={data.preguntas.length} />
              <Metric icon={Check} label="Respondidas" tone="success" value={answered} />
            </View>
            <SectionTitle
              subtitle={`${answered} de ${data.preguntas.length} completadas`}
              title="Cuestionario"
            />
            {data.preguntas.map((question, index) => (
              <Question
                answer={answers[question.id]}
                index={index}
                key={question.id}
                onAnswer={(answer) => {
                  setAnswers((current) => ({ ...current, [question.id]: answer }));
                  setError('');
                }}
                question={question}
              />
            ))}
            {error ? <AppText color={theme.colors.danger} style={styles.error} variant="caption">{error}</AppText> : null}
            <Button fullWidth icon={Send} label="Finalizar test" loading={sending} onPress={() => void submit()} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function Question({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: VocationalQuestion;
  index: number;
  answer?: boolean;
  onAnswer: (value: boolean) => void;
}) {
  return (
    <Card style={styles.questionCard}>
      <View style={styles.questionTop}>
        <View style={styles.questionNumber}>
          <AppText color={theme.colors.primary} variant="label">{index + 1}</AppText>
        </View>
        <AppText style={styles.questionText} variant="label">{question.denominacion}</AppText>
      </View>
      <View style={styles.answerRow}>
        <AnswerButton active={answer === true} icon={Check} label="Si" onPress={() => onAnswer(true)} positive />
        <AnswerButton active={answer === false} icon={X} label="No" onPress={() => onAnswer(false)} />
      </View>
    </Card>
  );
}

function AnswerButton({
  active,
  icon: Icon,
  label,
  onPress,
  positive = false,
}: {
  active: boolean;
  icon: typeof Check;
  label: string;
  onPress: () => void;
  positive?: boolean;
}) {
  const color = positive ? theme.colors.success : theme.colors.danger;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.answer,
        active && { backgroundColor: positive ? theme.colors.successSoft : theme.colors.dangerSoft, borderColor: color },
        pressed && styles.pressed,
      ]}>
      <Icon color={active ? color : theme.colors.textMuted} size={18} />
      <AppText color={active ? color : theme.colors.textMuted} variant="label">{label}</AppText>
    </Pressable>
  );
}

function Result({ data, onCertificate }: { data: VocationalTest; onCertificate: () => void }) {
  const result = data.resultado!;
  const scores = [
    { label: 'Ingenierias', value: result.puntajes.ingenieria, tone: theme.colors.accent },
    { label: 'Biomedicas', value: result.puntajes.biomedicas, tone: theme.colors.success },
    { label: 'Sociales', value: result.puntajes.sociales, tone: theme.colors.warning },
  ];
  const max = Math.max(...scores.map((item) => item.value), 1);
  return (
    <>
      <Card style={styles.resultHero}>
        <View style={styles.award}><Award color={theme.colors.warning} size={34} /></View>
        <AppText color="#BFE7F5" variant="micro">AREA SUGERIDA</AppText>
        <AppText color={theme.colors.surface} style={styles.resultTitle} variant="display">{result.area_sugerida}</AppText>
        <AppText color="#D6EDF5" variant="caption">Resultado emitido {formatDate(result.fecha)}</AppText>
      </Card>
      <SectionTitle subtitle="Distribucion de afinidad" title="Tus resultados" />
      <Card style={styles.scoreCard}>
        {scores.map((score) => (
          <View key={score.label} style={styles.scoreRow}>
            <View style={styles.scoreLabel}>
              <AppText variant="label">{score.label}</AppText>
              <AppText color={score.tone} variant="label">{score.value}</AppText>
            </View>
            <View style={styles.scoreTrack}>
              <View style={[styles.scoreFill, { backgroundColor: score.tone, width: `${Math.round((score.value / max) * 100)}%` }]} />
            </View>
          </View>
        ))}
      </Card>
      {data.constancia_url ? (
        <Button fullWidth icon={Download} label="Descargar constancia" onPress={onCertificate} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  introCard: { alignItems: 'center', flexDirection: 'row', gap: 11, marginHorizontal: 0 },
  introIcon: { alignItems: 'center', backgroundColor: theme.colors.warningSoft, borderRadius: 15, height: 50, justifyContent: 'center', width: 50 },
  introCopy: { flex: 1 },
  metrics: { flexDirection: 'row', gap: 9 },
  questionCard: { gap: 14, marginBottom: 0 },
  questionTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 },
  questionNumber: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 12, height: 34, justifyContent: 'center', width: 34 },
  questionText: { flex: 1, lineHeight: 22 },
  answerRow: { flexDirection: 'row', gap: 10 },
  answer: { alignItems: 'center', borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 46 },
  pressed: { opacity: 0.78 },
  error: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, padding: 11 },
  resultHero: { alignItems: 'center', backgroundColor: theme.colors.primaryStrong, borderColor: theme.colors.primaryStrong, gap: 8, paddingVertical: 28 },
  award: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 26, height: 64, justifyContent: 'center', marginBottom: 3, width: 64 },
  resultTitle: { fontSize: 30, textAlign: 'center' },
  scoreCard: { gap: 16, marginHorizontal: 0 },
  scoreRow: { gap: 7 },
  scoreLabel: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreTrack: { backgroundColor: theme.colors.border, borderRadius: 5, height: 9, overflow: 'hidden' },
  scoreFill: { borderRadius: 5, height: '100%' },
});
