import {
  BookMarked,
  BookOpenText,
  Download,
  FileText,
  Search,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import type { AcademicMaterial } from '@/services/api-types';
import { downloadAuthenticatedFile } from '@/services/files';
import { periodLabel } from '@/utils/format';

type MaterialTab = 'cuadernillos' | 'temarios';

export default function MaterialsScreen() {
  const { role, period } = useSession();
  const [tab, setTab] = useState<MaterialTab>('cuadernillos');
  const [items, setItems] = useState<AcademicMaterial[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<number>();

  useEffect(() => {
    void load();
    // Role and material type define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, tab]);

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const source = role === 'docente' ? api.teacher : api.student;
      setItems(tab === 'cuadernillos' ? await source.booklets() : await source.syllabi());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los materiales.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const search = query.trim().toLowerCase();
  const filtered = items.filter((item) =>
    [item.curso, item.tipo, item.semana].some((value) => String(value || '').toLowerCase().includes(search))
  );

  async function download(item: AcademicMaterial) {
    setDownloading(item.id);
    try {
      const fallback = `${tab === 'cuadernillos' ? 'cuadernillo' : 'temario'}-${item.curso}-${item.semana || item.id}.pdf`;
      const fileName = fileNameFromUrl(item.archivo_url) || fallback;
      await downloadAuthenticatedFile(item.archivo_url, fileName);
    } catch (caught) {
      Alert.alert('No se pudo abrir', caught instanceof Error ? caught.message : 'Intenta nuevamente.');
    } finally {
      setDownloading(undefined);
    }
  }

  return (
    <Screen onRefresh={() => load(true)} refreshing={refreshing}>
      <PageHeader
        back
        eyebrow="Biblioteca del ciclo"
        period={periodLabel(period)}
        subtitle="Documentos oficiales protegidos por tu sesion."
        title="Materiales"
      />
      <View style={styles.content}>
        <View style={styles.tabs}>
          <MaterialTabButton
            active={tab === 'cuadernillos'}
            icon={BookOpenText}
            label="Cuadernillos"
            onPress={() => setTab('cuadernillos')}
          />
          <MaterialTabButton
            active={tab === 'temarios'}
            icon={BookMarked}
            label="Temarios"
            onPress={() => setTab('temarios')}
          />
        </View>
        <Field icon={Search} onChangeText={setQuery} placeholder="Buscar por curso o semana" value={query} />
        <SectionTitle
          subtitle={`${filtered.length} documentos del periodo vigente`}
          title={tab === 'cuadernillos' ? 'Cuadernillos disponibles' : 'Temarios disponibles'}
        />

        {loading ? <LoadingState label="Organizando materiales..." /> : null}
        {error ? <ErrorState message={error} onRetry={() => load()} /> : null}
        {!loading && !error && !filtered.length ? (
          <EmptyState
            icon={tab === 'cuadernillos' ? BookOpenText : BookMarked}
            message={search ? 'Prueba con otro curso o semana.' : 'Todavia no se publicaron documentos para el ciclo activo.'}
            title={search ? 'Sin coincidencias' : 'Biblioteca vacia'}
          />
        ) : null}

        {!loading && !error ? filtered.map((item) => (
          <Card key={`${tab}-${item.id}`} style={styles.card}>
            <View style={[styles.fileIcon, { backgroundColor: `${safeColor(item.color)}1A` }]}>
              <FileText color={safeColor(item.color)} size={24} />
            </View>
            <View style={styles.fileCopy}>
              <AppText variant="heading">{item.curso}</AppText>
              <View style={styles.meta}>
                {item.semana ? <Pill label={`Semana ${item.semana}`} tone="accent" /> : null}
                {item.tipo ? <Pill label={item.tipo} /> : null}
              </View>
              <AppText color={theme.colors.textMuted} numberOfLines={1} variant="caption">
                {fileNameFromUrl(item.archivo_url) || 'Documento academico'}
              </AppText>
            </View>
            <Button
              compact
              icon={Download}
              label="Abrir"
              loading={downloading === item.id}
              onPress={() => void download(item)}
              variant="soft"
            />
          </Card>
        )) : null}
      </View>
    </Screen>
  );
}

function MaterialTabButton({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: typeof BookOpenText;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}>
      <Icon color={active ? theme.colors.primary : theme.colors.textMuted} size={20} />
      <AppText color={active ? theme.colors.primary : theme.colors.textMuted} variant="label">{label}</AppText>
    </Pressable>
  );
}

function safeColor(color?: string | null) {
  if (!color) return theme.colors.accent;
  const normalized = color.startsWith('#') ? color : `#${color}`;
  return /^#[0-9a-f]{6}$/i.test(normalized) ? normalized : theme.colors.accent;
}

function fileNameFromUrl(url: string) {
  try {
    return decodeURIComponent(url.split('/').pop()?.split('?')[0] || '');
  } catch {
    return '';
  }
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingHorizontal: 16, paddingTop: 18 },
  tabs: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 6,
  },
  tab: {
    alignItems: 'center',
    borderRadius: theme.radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 46,
  },
  tabActive: { backgroundColor: theme.colors.accentSoft },
  pressed: { opacity: 0.78 },
  card: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 0 },
  fileIcon: { alignItems: 'center', borderRadius: 16, height: 52, justifyContent: 'center', width: 52 },
  fileCopy: { flex: 1, gap: 5 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
