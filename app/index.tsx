import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ArrowRight,
  BookOpenCheck,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Field, Pill } from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';
import type { UserRole } from '@/services/api-types';

const campus = require('@/assets/images/cepreuna-campus.jpg');
const logo = require('@/assets/images/cepreuna-logo.png');

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const desktop = width >= 900;
  const { status, login } = useSession();
  const [role, setRole] = useState<UserRole>('estudiante');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') router.replace('/panel');
  }, [status]);

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError('Ingresa tu usuario y contrasena para continuar.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const cleanUser = normalizeUsername(username);
      await login({ usuario: cleanUser, password, rol: role });
      router.replace('/panel');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <LinearGradient colors={[palette.navy950, palette.navy800]} style={styles.loadingScreen}>
        <Image contentFit="contain" source={logo} style={styles.loadingLogo} />
        <ActivityIndicator color={palette.paper} size="large" />
        <AppText color="#D7EBF3" variant="caption">Validando tu acceso seguro...</AppText>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView edges={[]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}>
        <View style={[styles.layout, desktop && styles.layoutDesktop]}>
          <Hero desktop={desktop} />
          <ScrollView
            contentContainerStyle={[styles.formScroll, desktop && styles.formScrollDesktop]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={[styles.formPane, desktop && styles.formPaneDesktop]}>
            <View style={[styles.formCard, desktop && styles.formCardDesktop]}>
              <View style={styles.mobileBrand}>
                <Image contentFit="contain" source={logo} style={styles.mobileLogo} />
                <View>
                  <AppText color={theme.colors.primary} variant="heading">CEPREUNA</AppText>
                  <AppText color={theme.colors.textMuted} variant="micro">CAMPUS DIGITAL</AppText>
                </View>
              </View>

              <Pill icon={Sparkles} label="Un solo acceso para tu ciclo activo" tone="accent" />
              <View style={styles.headingBlock}>
                <AppText variant="display">Bienvenido de vuelta</AppText>
                <AppText color={theme.colors.textMuted} variant="body">
                  Ingresa con la cuenta institucional que corresponde a tu rol.
                </AppText>
              </View>

              <RoleSelector onChange={setRole} value={role} />

              <View style={styles.fields}>
                <Field
                  autoCapitalize="none"
                  autoComplete="username"
                  icon={Mail}
                  keyboardType="email-address"
                  label="DNI, usuario o correo institucional"
                  onChangeText={(value) => {
                    setUsername(value);
                    setError('');
                  }}
                  onSubmitEditing={() => undefined}
                  placeholder={role === 'estudiante' ? '60402055 o correo@cepreuna.edu.pe' : 'd_docente@cepreuna.edu.pe'}
                  returnKeyType="next"
                  value={username}
                />
                <Field
                  autoComplete="current-password"
                  icon={LockKeyhole}
                  label="Contrasena"
                  onChangeText={(value) => {
                    setPassword(value);
                    setError('');
                  }}
                  onSubmitEditing={handleLogin}
                  placeholder="Ingresa tu contrasena"
                  returnKeyType="go"
                  right={(
                    <Pressable
                      accessibilityLabel={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      onPress={() => setShowPassword((current) => !current)}
                      style={styles.eyeButton}>
                      {showPassword
                        ? <EyeOff color={theme.colors.textMuted} size={20} />
                        : <Eye color={theme.colors.textMuted} size={20} />}
                    </Pressable>
                  )}
                  secureTextEntry={!showPassword}
                  value={password}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <ShieldCheck color={theme.colors.danger} size={19} />
                  <AppText color={theme.colors.danger} style={styles.errorText} variant="caption">{error}</AppText>
                </View>
              ) : null}

              <Button
                disabled={submitting}
                fullWidth
                icon={ArrowRight}
                label={submitting ? 'Validando acceso...' : 'Ingresar al campus'}
                loading={submitting}
                onPress={handleLogin}
                trailingIcon
              />

              <View style={styles.securityNote}>
                <ShieldCheck color={theme.colors.success} size={17} />
                <AppText color={theme.colors.textMuted} style={styles.securityCopy} variant="caption">
                  El sistema usa automaticamente el ciclo vigente. Nunca debes seleccionarlo manualmente.
                </AppText>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Hero({ desktop }: { desktop: boolean }) {
  return (
    <View style={[styles.hero, desktop && styles.heroDesktop]}>
      <Image contentFit="cover" source={campus} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={desktop
          ? ['rgba(5,37,58,0.28)', 'rgba(5,37,58,0.88)']
          : ['rgba(5,37,58,0.22)', 'rgba(5,37,58,0.82)']}
        end={{ x: 0.8, y: 1 }}
        start={{ x: 0.1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroRing} />
      <View style={[styles.heroContent, desktop && styles.heroContentDesktop]}>
        <View style={styles.desktopBrand}>
          <View style={styles.logoShell}>
            <Image contentFit="contain" source={logo} style={styles.heroLogo} />
          </View>
          <View>
            <AppText color={palette.paper} variant="title">CEPREUNA</AppText>
            <AppText color="#BDE8F5" variant="micro">UNIVERSIDAD NACIONAL DEL ALTIPLANO</AppText>
          </View>
        </View>
        <View style={styles.heroCopy}>
          <AppText color="#BDE8F5" style={styles.heroEyebrow} variant="micro">APRENDE. AVANZA. INGRESA.</AppText>
          <AppText
            color={palette.paper}
            style={[styles.heroTitle, !desktop && styles.heroTitleMobile]}
            variant="display">
            Tu preparacion, organizada en un solo lugar.
          </AppText>
          {desktop ? (
            <AppText color="#D9EDF4" style={styles.heroSubtitle} variant="body">
              Cursos, horarios, pagos, materiales y comunicacion del ciclo activo, siempre disponibles.
            </AppText>
          ) : null}
        </View>
        {desktop ? (
          <View style={styles.heroFeatures}>
            <HeroFeature icon={BookOpenCheck} label="Contenido del ciclo vigente" />
            <HeroFeature icon={UserRoundCheck} label="Acceso separado por rol" />
            <HeroFeature icon={GraduationCap} label="Experiencia movil institucional" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function HeroFeature({ icon: Icon, label }: { icon: typeof BookOpenCheck; label: string }) {
  return (
    <View style={styles.heroFeature}>
      <View style={styles.heroFeatureIcon}>
        <Icon color="#C9F0FA" size={18} />
      </View>
      <AppText color="#ECF8FB" variant="caption">{label}</AppText>
    </View>
  );
}

function RoleSelector({ value, onChange }: { value: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <View style={styles.roleBlock}>
      <AppText color={theme.colors.textSoft} variant="label">Ingresa como</AppText>
      <View style={styles.roleSelector}>
        <RoleOption
          active={value === 'estudiante'}
          icon={GraduationCap}
          label="Estudiante"
          onPress={() => onChange('estudiante')}
        />
        <RoleOption
          active={value === 'docente'}
          icon={UserRoundCheck}
          label="Docente"
          onPress={() => onChange('docente')}
        />
      </View>
    </View>
  );
}

function RoleOption({
  active,
  icon: Icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: typeof GraduationCap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.roleOption, active && styles.roleOptionActive, pressed && styles.pressed]}>
      <Icon color={active ? palette.paper : theme.colors.textSoft} size={20} strokeWidth={2.4} />
      <AppText color={active ? palette.paper : theme.colors.textSoft} variant="label">{label}</AppText>
    </Pressable>
  );
}

function normalizeUsername(value: string) {
  const clean = value.trim().toLowerCase();
  return /^\d{8}$/.test(clean) ? `${clean}@cepreuna.edu.pe` : clean;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: theme.colors.background, flex: 1 },
  keyboard: { flex: 1 },
  layout: { flex: 1 },
  layoutDesktop: { flexDirection: 'row' },
  loadingScreen: { alignItems: 'center', flex: 1, gap: 18, justifyContent: 'center' },
  loadingLogo: { height: 98, width: 98 },
  hero: { height: 260, overflow: 'hidden' },
  heroDesktop: { flex: 1.08, height: '100%', minWidth: 480 },
  heroRing: {
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 190,
    borderWidth: 42,
    height: 370,
    position: 'absolute',
    right: -145,
    top: -110,
    width: 370,
  },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: 22 },
  heroContentDesktop: { justifyContent: 'space-between', padding: 44 },
  desktopBrand: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  logoShell: { alignItems: 'center', backgroundColor: palette.paper, borderRadius: 17, height: 58, justifyContent: 'center', width: 58 },
  heroLogo: { height: 48, width: 48 },
  heroCopy: { maxWidth: 610 },
  heroEyebrow: { letterSpacing: 1.5, marginBottom: 7 },
  heroTitle: { fontSize: 40, lineHeight: 45, maxWidth: 650 },
  heroTitleMobile: { fontSize: 34, letterSpacing: -0.35, lineHeight: 38, maxWidth: '96%' },
  heroSubtitle: { marginTop: 13, maxWidth: 520 },
  heroFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  heroFeature: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.16)', borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  heroFeatureIcon: { alignItems: 'center', justifyContent: 'center' },
  formPane: { alignSelf: 'stretch', backgroundColor: theme.colors.background, flex: 1, minWidth: 0 },
  formPaneDesktop: { flex: 0.92, minWidth: 470 },
  formScroll: { flexGrow: 1, justifyContent: 'center', minWidth: 0, padding: 18, paddingBottom: 38 },
  formScrollDesktop: { padding: 40 },
  formCard: { alignSelf: 'stretch', gap: 20, marginTop: -34, maxWidth: '100%', minWidth: 0 },
  formCardDesktop: { alignSelf: 'center', marginTop: 0, maxWidth: 500, width: '100%' },
  mobileBrand: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: palette.paper, borderColor: theme.colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 8, paddingRight: 14, ...theme.shadow },
  mobileLogo: { height: 44, width: 44 },
  headingBlock: { gap: 7, minWidth: 0 },
  fields: { gap: 16, minWidth: 0 },
  roleBlock: { gap: 8 },
  roleSelector: { backgroundColor: '#E8EFF2', borderRadius: 16, flexDirection: 'row', gap: 5, minWidth: 0, padding: 5, width: '100%' },
  roleOption: { alignItems: 'center', borderRadius: 12, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, minWidth: 0, paddingHorizontal: 8 },
  roleOptionActive: { backgroundColor: theme.colors.primary },
  eyeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  errorBox: { alignItems: 'flex-start', backgroundColor: theme.colors.dangerSoft, borderRadius: 14, flexDirection: 'row', gap: 9, padding: 12 },
  errorText: { flex: 1 },
  securityNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'center', paddingHorizontal: 8 },
  securityCopy: { flex: 1 },
  pressed: { opacity: 0.78 },
});
