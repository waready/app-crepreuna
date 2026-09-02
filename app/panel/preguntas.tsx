import * as DocumentPicker from 'expo-document-picker';
import {
  BadgeCheck,
  BookOpenText,
  Clock3,
  Download,
  FileCheck2,
  FileQuestion,
  FileText,
  MessageSquareWarning,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SelectField, type SelectOption } from '@/components/ui/select-field';
import {
  AppText,
  Button,
  Card,
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
import type { QuestionBatch, QuestionCourse, UploadFile } from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { formatDate, periodLabel, readableStatus } from '@/utils/format';

export default function QuestionsScreen() {
  const { period } = useSession();
  const [courses, setCourses] = useState<QuestionCourse[]>([]);
  const [items, setItems] = useState<QuestionBatch[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
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
      const [nextCourses, nextItems] = await Promise.all([
        api.teacher.questionCourses(),
        api.teacher.questionBatches(),
      ]);
      setCourses(nextCourses);
      setItems(nextItems);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el banco de preguntas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const search = query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    [item.curso, item.archivo_nombre, item.estado, item.nivel, item.semana]
      .some((value) => String(value || '').toLowerCase().includes(search))
  );
  const approved = items.filter((item) => isApproved(item.estado)).length;
  const observed = items.filter((item) => isObserved(item.estado)).length;

  async function template() {
    try {
      await downloadAuthenticatedFile(api.teacher.questionTemplateUrl(), 'plantilla-preguntas-cepreuna.docx');
    } catch (caught) {
      Alert.alert('No se pudo descargar', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }

  function remove(item: QuestionBatch) {
    Alert.alert(
      'Eliminar entrega',
      'Tambien se eliminara el archivo Word asociado. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.teacher.deleteQuestions(item.id);
              setItems((current) => current.filter((batch) => batch.id !== item.id));
            } catch (caught) {
              Alert.alert('No se pudo eliminar', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
            }
          },
        },
      ]
    );
  }

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow="Evaluacion academica"
        period={periodLabel(period)}
        subtitle="Envia dos preguntas por curso y semana usando el formato Word oficial."
        title="Banco de preguntas"
      />
      <View style={styles.metrics}>
        <Metric icon={FileQuestion} label="Entregas" value={items.length} />
        <Metric icon={BadgeCheck} label="Aprobadas" tone="success" value={approved} />
        <Metric icon={MessageSquareWarning} label="Observadas" tone="warning" value={observed} />
      </View>
      <View style={styles.content}>
        <Card style={styles.guideCard}>
          <View style={styles.guideIcon}><FileText color={theme.colors.accent} size={25} /></View>
          <View style={styles.guideCopy}>
            <AppText variant="heading">Formato obligatorio</AppText>
            <AppText color={theme.colors.textMuted} variant="caption">
              Descarga la plantilla, redacta exactamente dos preguntas y conserva su estructura.
            </AppText>
          </View>
          <Button compact icon={Download} label="Plantilla" onPress={() => void template()} variant="secondary" />
        </Card>
        <Button fullWidth icon={Plus} label="Nueva entrega Word" onPress={() => setOpen(true)} />
        <Field icon={Search} onChangeText={setQuery} placeholder="Buscar curso, semana o estado" value={query} />
        <SectionTitle subtitle={`${filtered.length} entregas encontradas`} title="Mis documentos" />
        {loading ? <LoadingState label="Consultando entregas..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {!loading && !error && !filtered.length ? (
          <EmptyState
            action={!search ? <Button compact icon={Plus} label="Crear primera entrega" onPress={() => setOpen(true)} /> : undefined}
            icon={FileQuestion}
            message={search ? 'Prueba con otro termino.' : 'Tus documentos apareceran aqui junto con el resultado de revision.'}
            title={search ? 'Sin coincidencias' : 'Aun no hay entregas'}
          />
        ) : null}
        {!loading && !error ? filtered.map((item) => (
          <QuestionCard item={item} key={item.id} onDelete={() => remove(item)} />
        )) : null}
      </View>
      <UploadModal
        courses={courses}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          void load();
        }}
        visible={open}
      />
    </Screen>
  );
}

function QuestionCard({ item, onDelete }: { item: QuestionBatch; onDelete: () => void }) {
  const status = questionStatus(item.estado);
  async function download(url: string, name: string) {
    try {
      await downloadAuthenticatedFile(url, name);
    } catch (caught) {
      Alert.alert('No se pudo abrir', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    }
  }
  return (
    <Card style={styles.card}>
      <View style={[styles.statusLine, { backgroundColor: status.color }]} />
      <View style={styles.cardTop}>
        <View style={[styles.fileIcon, { backgroundColor: status.soft }]}>
          <FileCheck2 color={status.color} size={24} />
        </View>
        <View style={styles.cardCopy}>
          <AppText variant="heading">{item.curso}</AppText>
          <AppText color={theme.colors.textMuted} numberOfLines={1} variant="caption">{item.archivo_nombre}</AppText>
        </View>
        <Pill label={status.label} tone={status.tone} />
      </View>
      <View style={styles.metaRow}>
        <Pill label={`Semana ${item.semana}`} tone="accent" />
        <Pill label={readableStatus(item.nivel)} />
        <Pill label={`Version ${item.version}`} />
      </View>
      {item.comentario ? (
        <View style={styles.comment}>
          <MessageSquareWarning color={status.color} size={18} />
          <View style={styles.commentCopy}>
            <AppText color={status.color} variant="micro">OBSERVACION DEL COORDINADOR</AppText>
            <AppText color={theme.colors.textSoft} variant="caption">{item.comentario}</AppText>
          </View>
        </View>
      ) : null}
      <View style={styles.cardFooter}>
        <AppText color={theme.colors.textMuted} variant="micro">ENVIADO {formatDate(item.created_at).toUpperCase()}</AppText>
        <View style={styles.actions}>
          <Button compact icon={Download} label="Word" onPress={() => void download(item.archivo_url, item.archivo_nombre)} variant="secondary" />
          {item.revision_url ? <Button compact icon={Download} label="Revision" onPress={() => void download(item.revision_url!, `revision-${item.archivo_nombre}`)} variant="soft" /> : null}
          <IconButton accessibilityLabel="Eliminar entrega" icon={Trash2} onPress={onDelete} tone="danger" />
        </View>
      </View>
    </Card>
  );
}

function UploadModal({
  visible,
  courses,
  onClose,
  onSaved,
}: {
  visible: boolean;
  courses: QuestionCourse[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [courseId, setCourseId] = useState('');
  const [week, setWeek] = useState('1');
  const [level, setLevel] = useState('intermedio');
  const [file, setFile] = useState<UploadFile>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setCourseId(courses[0] ? String(courses[0].id) : '');
    setWeek('1');
    setLevel('intermedio');
    setFile(undefined);
    setError('');
  }, [visible, courses]);

  const courseOptions: SelectOption[] = courses.map((course) => ({
    label: course.curso,
    value: String(course.id),
    description: [...course.grupos, ...course.modalidades].filter(Boolean).join(' / '),
  }));

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith('.docx')) {
      setError('Solo se admite el formato Word .docx.');
      return;
    }
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      setError('El documento no debe superar los 10 MB.');
      return;
    }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
    setError('');
  }

  async function submit() {
    if (!courseId) return setError('Selecciona el curso de la entrega.');
    if (!file) return setError('Adjunta el documento Word con las dos preguntas.');
    setSaving(true);
    setError('');
    try {
      await api.teacher.submitQuestions({
        curso_id: Number(courseId),
        semana: Number(week),
        nivel: level,
        archivo: file,
      });
      Alert.alert('Documento enviado', 'La entrega quedo disponible para revision del coordinador.');
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo enviar el documento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.scrim}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalTitle}>
              <AppText variant="title">Nueva entrega</AppText>
              <AppText color={theme.colors.textMuted} variant="caption">Documento Word con dos preguntas.</AppText>
            </View>
            <IconButton accessibilityLabel="Cerrar" icon={X} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <SelectField icon={BookOpenText} label="Curso" onChange={setCourseId} options={courseOptions} searchable value={courseId} />
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <SelectField
                  icon={Clock3}
                  label="Semana"
                  onChange={setWeek}
                  options={Array.from({ length: 30 }, (_, index) => ({ label: `Semana ${index + 1}`, value: String(index + 1) }))}
                  value={week}
                />
              </View>
              <View style={styles.formColumn}>
                <SelectField
                  icon={FileQuestion}
                  label="Nivel"
                  onChange={setLevel}
                  options={[
                    { label: 'Basico', value: 'basico' },
                    { label: 'Intermedio', value: 'intermedio' },
                    { label: 'Avanzado', value: 'avanzado' },
                  ]}
                  value={level}
                />
              </View>
            </View>
            <SectionTitle subtitle="Formato .docx / maximo 10 MB" title="Archivo de preguntas" />
            {file ? (
              <Card style={styles.selectedFile}>
                <View style={styles.selectedIcon}><FileCheck2 color={theme.colors.success} size={27} /></View>
                <View style={styles.selectedCopy}>
                  <AppText numberOfLines={1} variant="label">{file.name}</AppText>
                  <AppText color={theme.colors.textMuted} variant="caption">{file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Documento listo'}</AppText>
                </View>
                <Button compact label="Cambiar" onPress={() => void pickFile()} variant="secondary" />
              </Card>
            ) : (
              <Card onPress={() => void pickFile()} style={styles.uploadCard}>
                <View style={styles.uploadIcon}><Upload color={theme.colors.accent} size={28} /></View>
                <View style={styles.uploadCopy}>
                  <AppText variant="label">Seleccionar documento Word</AppText>
                  <AppText color={theme.colors.textMuted} variant="caption">Debe respetar la plantilla institucional.</AppText>
                </View>
              </Card>
            )}
            <View style={styles.requirement}>
              <FileQuestion color={theme.colors.warning} size={20} />
              <AppText color={theme.colors.textSoft} style={styles.requirementCopy} variant="caption">
                La entrega debe contener exactamente dos preguntas del curso, semana y nivel seleccionados.
              </AppText>
            </View>
            {error ? <AppText color={theme.colors.danger} style={styles.formError} variant="caption">{error}</AppText> : null}
            <Button disabled={!file} fullWidth icon={Send} label="Enviar para revision" loading={saving} onPress={() => void submit()} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function isApproved(value?: string) {
  const status = String(value || '').toLowerCase();
  return status.includes('aprobad') || status === 'aprobado';
}

function isObserved(value?: string) {
  const status = String(value || '').toLowerCase();
  return status.includes('observ') || status.includes('rechaz');
}

function questionStatus(value?: string) {
  if (isApproved(value)) return { color: theme.colors.success, soft: theme.colors.successSoft, tone: 'success' as const, label: 'Aprobado' };
  if (isObserved(value)) return { color: theme.colors.danger, soft: theme.colors.dangerSoft, tone: 'danger' as const, label: 'Con observacion' };
  return { color: theme.colors.warning, soft: theme.colors.warningSoft, tone: 'warning' as const, label: readableStatus(value || 'Por revisar') };
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: 9, marginHorizontal: 16 },
  content: { gap: 13, paddingHorizontal: 16, paddingTop: 19 },
  guideCard: { alignItems: 'center', flexDirection: 'row', gap: 11, marginHorizontal: 0 },
  guideIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  guideCopy: { flex: 1 },
  card: { gap: 12, marginBottom: 0, overflow: 'hidden', paddingLeft: 19 },
  statusLine: { bottom: 0, left: 0, position: 'absolute', top: 0, width: 5 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  fileIcon: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  cardCopy: { flex: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  comment: { alignItems: 'flex-start', backgroundColor: theme.colors.warningSoft, borderRadius: theme.radius.md, flexDirection: 'row', gap: 8, padding: 11 },
  commentCopy: { flex: 1, gap: 3 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  actions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  scrim: { backgroundColor: palette.scrim, flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '93%', minHeight: '70%', overflow: 'hidden' },
  handle: { alignSelf: 'center', backgroundColor: theme.colors.borderStrong, borderRadius: 4, height: 5, marginTop: 9, width: 46 },
  modalHeader: { alignItems: 'center', borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 18 },
  modalTitle: { flex: 1 },
  form: { gap: 14, padding: 16, paddingBottom: 44 },
  formRow: { flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  selectedFile: { alignItems: 'center', flexDirection: 'row', gap: 11, marginHorizontal: 0 },
  selectedIcon: { alignItems: 'center', backgroundColor: theme.colors.successSoft, borderRadius: 15, height: 50, justifyContent: 'center', width: 50 },
  selectedCopy: { flex: 1 },
  uploadCard: { alignItems: 'center', borderColor: '#A8D8E8', borderStyle: 'dashed', flexDirection: 'row', gap: 12, marginHorizontal: 0 },
  uploadIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 16, height: 54, justifyContent: 'center', width: 54 },
  uploadCopy: { flex: 1 },
  requirement: { alignItems: 'flex-start', backgroundColor: theme.colors.warningSoft, borderRadius: theme.radius.md, flexDirection: 'row', gap: 9, padding: 12 },
  requirementCopy: { flex: 1 },
  formError: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, padding: 11 },
});
