import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  Bell,
  BookOpenText,
  CalendarCheck,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  FileQuestion,
  Files,
  GraduationCap,
  LogOut,
  MessageCircleMore,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AuthenticatedAvatar } from '@/components/ui/authenticated-avatar';
import {
  AppText,
  Card,
  PageHeader,
  Pill,
  Screen,
  SectionTitle,
} from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import { api } from '@/services/api';
import { periodLabel } from '@/utils/format';

type MenuItem = {
  icon: typeof UserRound;
  title: string;
  description: string;
  route?: string;
  onPress?: () => void;
  tone?: string;
};

export default function ServicesScreen() {
  const { user, role, period, logout } = useSession();
  const teacher = role === 'docente';
  const common: MenuItem[] = [
    { icon: UserRound, title: 'Mi perfil', description: 'Datos personales, foto y contacto.', route: '/panel/perfil', tone: theme.colors.accent },
    { icon: CalendarCheck, title: 'Asistencia', description: teacher ? 'Sesiones y horas registradas.' : 'Asistencias, tardanzas y observaciones.', route: '/panel/asistencia', tone: theme.colors.success },
    { icon: Files, title: 'Materiales', description: 'Cuadernillos y temarios del ciclo.', route: '/panel/materiales', tone: theme.colors.warning },
    { icon: Bell, title: 'Notificaciones', description: 'Actividad reciente de tu cuenta.', route: '/panel/notificaciones', tone: theme.colors.info },
  ];
  const student: MenuItem[] = [
    { icon: CreditCard, title: 'Pagos y vouchers', description: 'Estado financiero y comprobantes.', route: '/panel/pagos', tone: theme.colors.success },
    { icon: GraduationCap, title: 'Test vocacional', description: 'Evaluacion y constancia de resultado.', route: '/panel/test-vocacional', tone: theme.colors.warning },
  ];
  const teacherItems: MenuItem[] = [
    { icon: ClipboardList, title: 'Sesiones', description: 'Registra tu avance academico.', route: '/panel/sesiones', tone: theme.colors.success },
    { icon: FileQuestion, title: 'Banco de preguntas', description: 'Entregas Word y revisiones.', route: '/panel/preguntas', tone: theme.colors.warning },
    { icon: BookOpenText, title: 'Centro docente', description: 'Resumen de recursos y cargas.', route: '/panel/docente-recursos', tone: theme.colors.accent },
  ];

  function signOut() {
    Alert.alert('Cerrar sesion', 'Tendras que volver a ingresar tus credenciales.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesion',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  }

  const photoUrl = user ? user.foto_url || api.profile.photoUrl() : undefined;

  return (
    <Screen>
      <PageHeader
        eyebrow="Cuenta y servicios"
        period={periodLabel(period)}
        subtitle="Todo lo que necesitas fuera de tus accesos principales."
        title="Menu"
      />
      <View style={styles.content}>
        {user ? (
          <Card onPress={() => router.push('/panel/perfil')} style={styles.profileCard}>
            <AuthenticatedAvatar accent={palette.paper} name={user.nombre_completo} size={62} url={photoUrl} />
            <View style={styles.profileCopy}>
              <AppText color={palette.paper} numberOfLines={2} variant="heading">{user.nombre_completo}</AppText>
              <AppText color="#CBE6F2" variant="caption">{teacher ? 'Docente' : 'Estudiante'} / {user.nro_documento || user.usuario}</AppText>
              <View style={styles.profilePills}>
                <Pill icon={ShieldCheck} label="Sesion protegida" tone="glass" />
              </View>
            </View>
            <ChevronRight color={palette.paper} size={22} />
          </Card>
        ) : null}

        <SectionTitle subtitle="Opciones disponibles para tu cuenta" title="Servicios" />
        <View style={styles.grid}>
          {[...common, ...(teacher ? teacherItems : student)].map((item) => (
            <MenuCard item={item} key={item.title} />
          ))}
        </View>

        <SectionTitle subtitle="Canales institucionales" title="Ayuda" />
        <MenuRow
          icon={MessageCircleMore}
          onPress={() => router.push('/panel')}
          subtitle="Consulta avisos y publicaciones del ciclo."
          title="Foro CEPREUNA"
        />
        <MenuRow
          icon={CircleHelp}
          onPress={() => void Linking.openURL('https://www.cepreuna.edu.pe/')}
          subtitle="Informacion y contacto institucional."
          title="Portal de ayuda"
        />
        <MenuRow
          danger
          icon={LogOut}
          onPress={signOut}
          subtitle="Finaliza de forma segura en este dispositivo."
          title="Cerrar sesion"
        />

        <AppText color={theme.colors.textMuted} style={styles.version} variant="micro">
          APP CEPREUNA / VERSION {Constants.expoConfig?.version || '1.0.0'}
        </AppText>
      </View>
    </Screen>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <Pressable
      onPress={() => item.onPress ? item.onPress() : item.route ? router.push(item.route as never) : undefined}
      style={({ pressed }) => [styles.menuCard, pressed && styles.pressed]}>
      <View style={[styles.menuIcon, { backgroundColor: `${item.tone || theme.colors.accent}18` }]}>
        <Icon color={item.tone || theme.colors.accent} size={24} />
      </View>
      <AppText variant="label">{item.title}</AppText>
      <AppText color={theme.colors.textMuted} numberOfLines={2} variant="caption">{item.description}</AppText>
    </Pressable>
  );
}

function MenuRow({
  icon: Icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: typeof CircleHelp;
  title: string;
  subtitle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Card onPress={onPress} style={styles.menuRow}>
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Icon color={danger ? theme.colors.danger : theme.colors.primary} size={21} />
      </View>
      <View style={styles.rowCopy}>
        <AppText color={danger ? theme.colors.danger : theme.colors.text} variant="label">{title}</AppText>
        <AppText color={theme.colors.textMuted} variant="caption">{subtitle}</AppText>
      </View>
      <ChevronRight color={danger ? theme.colors.danger : theme.colors.textMuted} size={20} />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingHorizontal: 16, paddingTop: 18 },
  profileCard: { alignItems: 'center', backgroundColor: theme.colors.primaryStrong, borderColor: theme.colors.primaryStrong, flexDirection: 'row', gap: 12, marginHorizontal: 0 },
  profileCopy: { flex: 1, gap: 3 },
  profilePills: { flexDirection: 'row', marginTop: 5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, borderWidth: 1, flexBasis: '46%', flexGrow: 1, gap: 7, minHeight: 150, padding: 14 },
  menuIcon: { alignItems: 'center', borderRadius: 15, height: 48, justifyContent: 'center', marginBottom: 3, width: 48 },
  menuRow: { alignItems: 'center', flexDirection: 'row', gap: 11, marginBottom: 0 },
  rowIcon: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 14, height: 46, justifyContent: 'center', width: 46 },
  rowIconDanger: { backgroundColor: theme.colors.dangerSoft },
  rowCopy: { flex: 1 },
  pressed: { opacity: 0.78 },
  version: { paddingBottom: 4, paddingTop: 10, textAlign: 'center' },
});
