import type React from 'react';
import { Brain, CheckCircle2, Clock, FileQuestion, Play, Trophy } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApiResource } from '@/hooks/use-api-resource';
import { api } from '@/services/api';
import { findArray, pickString } from '@/services/normalizers';

const quizzes = [
  { title: 'Simulacro Ingenierias', subject: 'Matematica y fisica', questions: 60, time: '120 min', level: 'Intermedio' },
  { title: 'Simulacro Biomedicas', subject: 'Biologia y quimica', questions: 60, time: '120 min', level: 'Avanzado' },
  { title: 'Practica Sociales', subject: 'Historia y lenguaje', questions: 40, time: '80 min', level: 'Basico' },
];

const stages = ['Habilidades', 'Intereses', 'Personalidad', 'Valores', 'Resumen'];

export default function EvaluationsScreen() {
  const loadQuestions = useCallback(() => api.getPreguntas(), []);
  const { data, loading, error } = useApiResource(loadQuestions);
  const questions = useMemo(() => findArray(data, ['preguntas', 'data', 'items']), [data]);
  const areas = useMemo(() => {
    const names = questions.map((item) => pickString(item, ['area', 'tipo'], 'General'));
    return Array.from(new Set(names)).filter(Boolean);
  }, [questions]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Trophy color="#ffffff" size={28} />
          </View>
          <Text style={styles.kicker}>Evaluaciones</Text>
          <Text style={styles.title}>Simulacros y test vocacional</Text>
          <Text style={styles.subtitle}>Practica por areas, mide tu avance y completa tu orientacion vocacional.</Text>
        </View>

        <Text style={styles.sectionTitle}>Simulacros por area</Text>
        <View style={styles.quizList}>
          {quizzes.map((quiz) => (
            <View key={quiz.title} style={styles.quizCard}>
              <View style={styles.quizTop}>
                <View style={styles.quizIcon}>
                  <FileQuestion color="#00365A" size={24} />
                </View>
                <Text style={styles.levelPill}>{quiz.level}</Text>
              </View>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizSubject}>{quiz.subject}</Text>
              <View style={styles.metaRow}>
                <Meta icon={<CheckCircle2 color="#0F7A59" size={15} />} text={`${quiz.questions} preguntas`} />
                <Meta icon={<Clock color="#006CAF" size={15} />} text={quiz.time} />
              </View>
              <View style={styles.startButton}>
                <Play color="#ffffff" size={17} />
                <Text style={styles.startText}>Comenzar simulacro</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Test vocacional</Text>
        {loading ? <Text style={styles.infoText}>Cargando preguntas del test...</Text> : null}
        {error ? <Text style={styles.errorText}>Modo demo: {error}</Text> : null}
        <View style={styles.vocationalCard}>
          <View style={styles.vocationalHeader}>
            <View style={styles.brainIcon}>
              <Brain color="#ffffff" size={26} />
            </View>
            <View style={styles.vocationalCopy}>
              <Text style={styles.vocationalTitle}>Orientacion por etapas</Text>
              <Text style={styles.vocationalText}>
                {questions.length
                  ? `${questions.length} preguntas disponibles en ${areas.length || 1} areas.`
                  : 'Completa preguntas de habilidades, intereses, personalidad y valores.'}
              </Text>
            </View>
          </View>

          <View style={styles.stageList}>
            {(areas.length ? areas : stages).map((stage, index) => (
              <View key={stage} style={styles.stageItem}>
                <Text style={styles.stageNumber}>{index + 1}</Text>
                <Text style={styles.stageText}>{stage}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.meta}>
      {icon}
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#f3f7fa', flex: 1 },
  container: { gap: 14, padding: 16, paddingBottom: 86 },
  header: { backgroundColor: '#00365A', borderRadius: 8, padding: 18 },
  headerIcon: { alignItems: 'center', backgroundColor: '#006CAF', borderRadius: 8, height: 52, justifyContent: 'center', marginBottom: 14, width: 52 },
  kicker: { color: '#BFE8FF', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: 0, lineHeight: 32, marginTop: 4 },
  subtitle: { color: '#d9ebf5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  sectionTitle: { color: '#00365A', fontSize: 20, fontWeight: '900', marginTop: 2 },
  quizList: { gap: 12 },
  quizCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 10, padding: 15 },
  quizTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  quizIcon: { alignItems: 'center', backgroundColor: '#d8edf8', borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  levelPill: { backgroundColor: '#eef7fc', borderRadius: 8, color: '#006CAF', fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7 },
  quizTitle: { color: '#00365A', fontSize: 18, fontWeight: '900' },
  quizSubject: { color: '#687784', fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', gap: 9 },
  meta: { alignItems: 'center', backgroundColor: '#f3f7fa', borderRadius: 8, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  metaText: { color: '#45525d', fontSize: 11, fontWeight: '800' },
  startButton: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#00365A', borderRadius: 8, flexDirection: 'row', gap: 7, marginTop: 2, paddingHorizontal: 13, paddingVertical: 11 },
  startText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  vocationalCard: { backgroundColor: '#ffffff', borderColor: '#e1ebf2', borderRadius: 8, borderWidth: 1, gap: 14, padding: 15 },
  vocationalHeader: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  brainIcon: { alignItems: 'center', backgroundColor: '#0F7A59', borderRadius: 8, height: 50, justifyContent: 'center', width: 50 },
  vocationalCopy: { flex: 1 },
  vocationalTitle: { color: '#00365A', fontSize: 17, fontWeight: '900' },
  vocationalText: { color: '#687784', fontSize: 12, lineHeight: 18, marginTop: 3 },
  stageList: { gap: 8 },
  stageItem: { alignItems: 'center', backgroundColor: '#f3f7fa', borderRadius: 8, flexDirection: 'row', gap: 10, padding: 10 },
  stageNumber: { backgroundColor: '#00365A', borderRadius: 7, color: '#ffffff', fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6 },
  stageText: { color: '#00365A', flex: 1, fontSize: 14, fontWeight: '900' },
  infoText: { backgroundColor: '#eef7fc', borderColor: '#cfe7f5', borderRadius: 8, borderWidth: 1, color: '#365465', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
  errorText: { backgroundColor: '#fff8e8', borderColor: '#f1dfb5', borderRadius: 8, borderWidth: 1, color: '#614918', fontSize: 12, fontWeight: '800', lineHeight: 18, padding: 10 },
});
