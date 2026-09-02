import {
  BookOpenText,
  CalendarDays,
  ClipboardList,
  Clock3,
  Edit3,
  FileText,
  Filter,
  Plus,
  Save,
  Trash2,
  Video,
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
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { TeacherCourse, TeacherSession } from '@/services/api-types';
import { formatDate, periodLabel } from '@/utils/format';

type SessionForm = { carga_id: string; fecha: string; tema: string; semana: string };

export default function SessionsScreen() {
  const { period } = useSession();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<TeacherSession | null>();
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
      const [nextCourses, nextSessions] = await Promise.all([
        api.teacher.courses(),
        api.teacher.sessions(),
      ]);
      setCourses(nextCourses);
      setSessions(nextSessions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar las sesiones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const courseOptions: SelectOption[] = courses.map((course) => ({
    label: `${course.curso}${course.grupo ? ` / ${course.grupo}` : ''}`,
    value: String(course.id),
    description: `${course.modalidad}${course.sede ? ` / ${course.sede}` : ''}`,
  }));
  const filterOptions: SelectOption[] = [
    { label: 'Todas las cargas', value: '' },
    ...courseOptions,
  ];
  const filtered = filter ? sessions.filter((session) => session.carga_id === Number(filter)) : sessions;

  function remove(item: TeacherSession) {
    Alert.alert(
      'Eliminar sesion',
      `Se eliminara el tema "${item.tema}". Esta accion no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.teacher.deleteSession(item.id);
              setSessions((current) => current.filter((session) => session.id !== item.id));
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
        eyebrow="Planificacion docente"
        period={periodLabel(period)}
        subtitle="Registra el avance real de cada carga academica."
        title="Sesiones"
      />
      <View style={styles.content}>
        <Button fullWidth icon={Plus} label="Nueva sesion" onPress={() => setEditing(null)} />
        <SelectField
          icon={Filter}
          label="Filtrar por carga"
          onChange={setFilter}
          options={filterOptions}
          searchable
          value={filter}
        />
        <SectionTitle
          subtitle={`${filtered.length} registros del ciclo activo`}
          title="Avance academico"
        />
        {loading ? <LoadingState label="Consultando sesiones..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {!loading && !error && !filtered.length ? (
          <EmptyState
            action={<Button compact icon={Plus} label="Registrar primera sesion" onPress={() => setEditing(null)} />}
            icon={ClipboardList}
            message={filter ? 'Esta carga todavia no tiene sesiones.' : 'Comienza registrando el tema dictado en tu primera clase.'}
            title="Sin sesiones registradas"
          />
        ) : null}
        {!loading && !error ? filtered.map((item) => (
          <SessionCard item={item} key={item.id} onDelete={() => remove(item)} onEdit={() => setEditing(item)} />
        )) : null}
      </View>
      <SessionModal
        courses={courseOptions}
        item={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          void load();
        }}
        visible={editing !== undefined}
      />
    </Screen>
  );
}

function SessionCard({ item, onEdit, onDelete }: { item: TeacherSession; onEdit: () => void; onDelete: () => void }) {
  const virtual = item.modalidad?.toLowerCase() === 'virtual';
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.dateBadge}>
          <CalendarDays color={theme.colors.accent} size={21} />
        </View>
        <View style={styles.cardHeading}>
          <AppText variant="heading">{item.curso}</AppText>
          <AppText color={theme.colors.textMuted} variant="caption">
            {[item.grupo ? `Grupo ${item.grupo}` : null, formatDate(item.fecha)].filter(Boolean).join(' / ')}
          </AppText>
        </View>
        {item.modalidad ? <Pill icon={virtual ? Video : BookOpenText} label={item.modalidad} tone={virtual ? 'info' : 'success'} /> : null}
      </View>
      <View style={styles.topic}>
        <FileText color={theme.colors.primary} size={19} />
        <View style={styles.topicCopy}>
          <AppText color={theme.colors.textMuted} variant="micro">TEMA DESARROLLADO</AppText>
          <AppText variant="label">{item.tema}</AppText>
        </View>
      </View>
      <View style={styles.cardFooter}>
        {item.semana ? <Pill icon={Clock3} label={`Semana ${item.semana}`} tone="accent" /> : <View />}
        <View style={styles.actions}>
          <Button compact icon={Edit3} label="Editar" onPress={onEdit} variant="secondary" />
          <IconButton accessibilityLabel="Eliminar sesion" icon={Trash2} onPress={onDelete} tone="danger" />
        </View>
      </View>
    </Card>
  );
}

function SessionModal({
  visible,
  item,
  courses,
  onClose,
  onSaved,
}: {
  visible: boolean;
  item: TeacherSession | null | undefined;
  courses: SelectOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<SessionForm>({ carga_id: '', fecha: '', tema: '', semana: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setForm({
      carga_id: item ? String(item.carga_id) : courses[0]?.value || '',
      fecha: item?.fecha || new Date().toISOString().slice(0, 10),
      tema: item?.tema || '',
      semana: item?.semana || '',
    });
    setError('');
  }, [visible, item, courses]);

  async function save() {
    if (!form.carga_id) return setError('Selecciona una carga academica.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) return setError('La fecha debe tener formato AAAA-MM-DD.');
    if (form.tema.trim().length < 3) return setError('Describe el tema desarrollado.');
    setSaving(true);
    setError('');
    try {
      const payload = {
        carga_id: Number(form.carga_id),
        fecha: form.fecha,
        tema: form.tema.trim(),
        semana: form.semana.trim() || null,
      };
      if (item) await api.teacher.updateSession(item.id, payload);
      else await api.teacher.createSession(payload);
      Alert.alert(item ? 'Sesion actualizada' : 'Sesion registrada', 'Los cambios fueron guardados correctamente.');
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar la sesion.');
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
              <AppText variant="title">{item ? 'Editar sesion' : 'Nueva sesion'}</AppText>
              <AppText color={theme.colors.textMuted} variant="caption">Registra el avance de una clase.</AppText>
            </View>
            <IconButton accessibilityLabel="Cerrar" icon={X} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <SelectField
              disabled={Boolean(item)}
              icon={BookOpenText}
              label="Carga academica"
              onChange={(carga_id) => setForm((current) => ({ ...current, carga_id }))}
              options={courses}
              searchable
              value={form.carga_id}
            />
            <View style={styles.formRow}>
              <Field containerStyle={styles.formColumn} icon={CalendarDays} label="Fecha" maxLength={10} onChangeText={(fecha) => setForm((current) => ({ ...current, fecha }))} placeholder="AAAA-MM-DD" value={form.fecha} />
              <Field containerStyle={styles.formColumn} icon={Clock3} keyboardType="number-pad" label="Semana" onChangeText={(semana) => setForm((current) => ({ ...current, semana }))} placeholder="Ej. 4" value={form.semana} />
            </View>
            <Field icon={FileText} label="Tema desarrollado" multiline onChangeText={(tema) => setForm((current) => ({ ...current, tema }))} placeholder="Describe el contenido trabajado..." value={form.tema} />
            {error ? <AppText color={theme.colors.danger} style={styles.formError} variant="caption">{error}</AppText> : null}
            <Button fullWidth icon={Save} label={item ? 'Guardar cambios' : 'Registrar sesion'} loading={saving} onPress={() => void save()} />
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingHorizontal: 16, paddingTop: 18 },
  card: { gap: 12, marginBottom: 0 },
  cardTop: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  dateBadge: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  cardHeading: { flex: 1 },
  topic: { alignItems: 'flex-start', backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radius.md, flexDirection: 'row', gap: 9, padding: 11 },
  topicCopy: { flex: 1, gap: 3 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  actions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  scrim: { backgroundColor: palette.scrim, flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', minHeight: '62%', overflow: 'hidden' },
  handle: { alignSelf: 'center', backgroundColor: theme.colors.borderStrong, borderRadius: 4, height: 5, marginTop: 9, width: 46 },
  modalHeader: { alignItems: 'center', borderBottomColor: theme.colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 18 },
  modalTitle: { flex: 1 },
  form: { gap: 14, padding: 16, paddingBottom: 42 },
  formRow: { flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  formError: { backgroundColor: theme.colors.dangerSoft, borderRadius: 12, padding: 11 },
});
