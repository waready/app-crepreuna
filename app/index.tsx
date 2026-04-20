import { Image, ImageBackground } from 'expo-image';
import { router } from 'expo-router';
import {
  ArrowRight,
  CalendarDays,
  Eye,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, getLastPanelPath, hasValidatedSession, markSessionValidated, saveLastPanelPath } from '@/services/api';

type AccessMode = 'student' | 'teacher';
type LoginMethod = 'google' | 'credentials';

const GOOGLE_COLORS = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_PATTERN = /^\d{8}$/;

export default function LoginScreen() {
  const [mode, setMode] = useState<AccessMode>('student');
  const [method, setMethod] = useState<LoginMethod>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { height, width } = useWindowDimensions();
  const compact = height < 720;
  const wide = width >= 760;

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        if (!(await hasValidatedSession())) {
          if (mounted) {
            setRestoringSession(false);
          }
          return;
        }
        if (mounted) {
          await markSessionValidated();
          router.replace((await getLastPanelPath()) as never);
        }
      } catch {
        // Si la sesion ya vencio, el interceptor limpia y dejamos el login disponible.
        if (mounted) {
          setRestoringSession(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  const enterApp = async () => {
    if (method === 'google') {
      setLoginError('El backend actual no expone OAuth Google. Usa Usuario y Contrasena para ingresar.');
      return;
    }

    const normalizedEmail = normalizeLoginIdentifier(email);

    if (!normalizedEmail || !password.trim()) {
      setLoginError('Ingresa tu usuario/correo y contrasena.');
      return;
    }

    if (!isInstitutionalCredential(email)) {
      setLoginError('Ingresa un DNI de 8 digitos o un correo valido.');
      return;
    }

    setLoading(true);
    setLoginError(null);
    try {
      await api.login({ email: normalizedEmail, password });
      try {
        await api.validateAuthenticatedAccess();
      } catch {
        await api.logout().catch(() => undefined);
        throw new Error(
          Platform.OS === 'web'
            ? 'Login correcto, pero la sesion no quedo guardada. En web abre la app desde http://localhost:3000 para usar el proxy de cookies.'
            : 'Login correcto, pero Android no recibio una sesion valida. Revisa que el backend envie session_id o un token usable para la app movil.'
        );
      }
      await markSessionValidated();
      await saveLastPanelPath('/panel');
      router.replace('/panel');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesion.';
      setLoginError(message.toLowerCase().includes('sin conexion') ? 'Estas sin internet. Conectate a Wi-Fi o datos moviles e intenta nuevamente.' : message);
    } finally {
      setLoading(false);
    }
  };

  if (restoringSession) {
    return (
      <View style={styles.restoreScreen}>
        <View style={styles.restoreCard}>
          <Image source={require('@/assets/images/cepreuna-logo.png')} style={styles.restoreLogo} contentFit="contain" />
          <ActivityIndicator color="#00365A" size="large" />
          <Text style={styles.restoreTitle}>Retomando tu pantalla</Text>
          <Text style={styles.restoreText}>Manteniendo tu sesion activa...</Text>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('@/assets/images/cepreuna-campus.jpg')}
      style={styles.background}
      contentFit="cover">
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'android' ? 18 : 0}
            style={styles.keyboardView}>
            <ScrollView
              contentContainerStyle={[
                styles.container,
                compact && styles.containerCompact,
                wide && styles.containerWide,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={[styles.hero, compact && styles.heroCompact, wide && styles.heroWide]}>
              <View style={styles.identityRow}>
                <View style={styles.logoShell}>
                  <Image
                    source={require('@/assets/images/cepreuna-logo.png')}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.kicker}>Universidad Nacional del Altiplano</Text>
                  <Text style={styles.brand}>CEPREUNA</Text>
                </View>
              </View>

              <View style={[styles.heroCopy, !wide && styles.heroCopyMobile, compact && styles.heroCopyCompact]}>
                <Text style={[styles.title, compact && styles.titleCompact]}>
                  Centro Pre Universitario
                </Text>
                <Text style={styles.subtitle}>
                  Plataforma academica para estudiantes y docentes.
                </Text>
              </View>

              <View style={[styles.highlightRow, compact && styles.highlightRowCompact]}>
                <Highlight icon={<CalendarDays color="#00365A" size={18} />} title="Ciclo 2026" text="Marzo - Julio" />
                <Highlight icon={<ShieldCheck color="#00365A" size={18} />} title="Acceso" text="Institucional" />
              </View>
            </View>

            <View style={[styles.loginPanel, wide && styles.loginPanelWide]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelTitleGroup}>
                  <Text style={styles.formEyebrow}>Acceso seguro</Text>
                  <Text style={styles.formTitle}>Iniciar sesion</Text>
                </View>
                <View style={styles.sparkBadge}>
                  <Sparkles color="#ffffff" size={18} />
                </View>
              </View>

              <View style={styles.segment}>
                <SegmentButton
                  active={mode === 'student'}
                  icon={<GraduationCap size={16} color={mode === 'student' ? '#ffffff' : '#00365A'} />}
                  label="Estudiante"
                  onPress={() => {
                    setMode('student');
                  }}
                />
                <SegmentButton
                  active={mode === 'teacher'}
                  icon={<ShieldCheck size={16} color={mode === 'teacher' ? '#ffffff' : '#00365A'} />}
                  label="Docente"
                  onPress={() => {
                    setMode('teacher');
                  }}
                />
              </View>

              <View style={styles.methodSwitch}>
                <MethodButton
                  active={method === 'google'}
                  label="Google"
                  onPress={() => setMethod('google')}
                />
                <MethodButton
                  active={method === 'credentials'}
                  label="Usuario"
                  onPress={() => setMethod('credentials')}
                />
              </View>

              {method === 'google' ? (
                <View style={styles.accessBlock}>
                  <Text style={styles.contextText}>{mode === 'student'
                    ? 'Continua con tu correo institucional de estudiante.'
                    : 'Continua con tu correo institucional docente.'}
                  </Text>
                  {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
                  <Pressable style={styles.googleButton} onPress={enterApp}>
                    <View style={styles.googleMark}>
                      {GOOGLE_COLORS.map((color) => (
                        <View key={color} style={[styles.googleDot, { backgroundColor: color }]} />
                      ))}
                    </View>
                    <Text style={styles.googleText}>Continuar con Google</Text>
                    <View style={styles.arrowBubble}>
                      <ArrowRight color="#ffffff" size={18} />
                    </View>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.form}>
                  <InputField
                    icon={<UserRound color="#687784" size={19} />}
                    label="Usuario"
                    placeholder={mode === 'student' ? 'Codigo de estudiante' : 'Usuario docente'}
                    value={email}
                    onChangeText={setEmail}
                  />
                  <InputField
                    icon={<LockKeyhole color="#687784" size={19} />}
                    label="Contrasena"
                    placeholder="Contrasena"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}
                  <View style={styles.formActions}>
                    <Pressable style={styles.forgotButton}>
                      <Text style={styles.forgotText}>Recuperar acceso</Text>
                    </Pressable>
                  </View>
                  <Pressable style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={enterApp} disabled={loading}>
                    <Text style={styles.submitText}>{loading ? 'Validando...' : 'Ingresar'}</Text>
                    <ArrowRight color="#ffffff" size={19} />
                  </Pressable>
                </View>
              )}

              <View style={styles.cycleCard}>
                <View style={styles.cycleIcon}>
                  <GraduationCap color="#00365A" size={20} />
                </View>
                <View style={styles.cycleTextGroup}>
                  <Text style={styles.cycleLabel}>Ciclo vigente</Text>
                  <Text style={styles.cycleTitle}>Marzo - Julio 2026</Text>
                </View>
                <Text style={styles.statusPill}>Activo</Text>
              </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

function normalizeLoginIdentifier(value: string) {
  const trimmed = value.trim().toLowerCase();
  return DNI_PATTERN.test(trimmed) ? `${trimmed}@cepreuna.edu.pe` : trimmed;
}

function isInstitutionalCredential(value: string) {
  const trimmed = value.trim().toLowerCase();
  return DNI_PATTERN.test(trimmed) || EMAIL_PATTERN.test(trimmed);
}

function SegmentButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentButtonActive]}>
      {icon}
      <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function MethodButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.methodButton, active && styles.methodButtonActive]}>
      <Text style={[styles.methodText, active && styles.methodTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Highlight({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <View style={styles.highlight}>
      <View style={styles.highlightIcon}>{icon}</View>
      <View style={styles.highlightCopy}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightText}>{text}</Text>
      </View>
    </View>
  );
}

function InputField({
  icon,
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
}: {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(!secureTextEntry);
  const hidden = Boolean(secureTextEntry && !visible);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        {icon}
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          importantForAutofill="yes"
          placeholder={placeholder}
          placeholderTextColor="#9aa6af"
          returnKeyType={secureTextEntry ? 'done' : 'next'}
          secureTextEntry={hidden}
          style={styles.input}
          textContentType={secureTextEntry ? 'password' : 'username'}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityLabel={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
            hitSlop={10}
            style={styles.eyeButton}
            onPress={() => setVisible((current) => !current)}>
            <Eye color={visible ? '#006CAF' : '#687784'} size={20} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  restoreScreen: {
    alignItems: 'center',
    backgroundColor: '#00365A',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  restoreCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    gap: 14,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  restoreLogo: {
    height: 64,
    width: 190,
  },
  restoreTitle: {
    color: '#00365A',
    fontSize: 18,
    fontWeight: '900',
  },
  restoreText: {
    color: '#687784',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  background: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 30, 50, 0.75)',
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  containerCompact: {
    paddingVertical: 16,
  },
  containerWide: {
    flexDirection: 'row',
    gap: 34,
    justifyContent: 'center',
    paddingHorizontal: 42,
  },
  hero: {
    gap: 16,
    maxWidth: 440,
    width: '100%',
  },
  heroCompact: {
    gap: 11,
  },
  heroWide: {
    flex: 1,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  logoShell: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 8,
    borderWidth: 1,
    boxShadow: '0px 18px 34px rgba(0, 18, 31, 0.28)',
    height: 74,
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: 128,
  },
  logo: {
    height: 54,
    width: '100%',
  },
  identityText: {
    flex: 1,
  },
  kicker: {
    color: '#BFE8FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  brand: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  heroCopy: {
    gap: 9,
  },
  heroCopyMobile: {
    alignItems: 'center',
  },
  heroCopyCompact: {
    gap: 5,
  },
  title: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 41,
  },
  titleCompact: {
    fontSize: 29,
    lineHeight: 32,
  },
  subtitle: {
    color: '#d9ebf5',
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 360,
    textAlign: 'center',
  },
  highlightRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  highlightRowCompact: {
    gap: 8,
  },
  highlight: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.64)',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 62,
    padding: 10,
  },
  highlightIcon: {
    alignItems: 'center',
    backgroundColor: '#d8edf8',
    borderRadius: 7,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  highlightCopy: {
    flex: 1,
  },
  highlightTitle: {
    color: '#00365A',
    fontSize: 13,
    fontWeight: '900',
  },
  highlightText: {
    color: '#617380',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  loginPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    boxShadow: '0px 24px 46px rgba(0, 14, 24, 0.26)',
    gap: 13,
    marginTop: 16,
    maxWidth: 440,
    padding: 16,
    width: '100%',
  },
  loginPanelWide: {
    flex: 1,
    marginTop: 0,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelTitleGroup: {
    flex: 1,
  },
  formEyebrow: {
    color: '#006CAF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  formTitle: {
    color: '#00365A',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  sparkBadge: {
    alignItems: 'center',
    backgroundColor: '#006CAF',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  segment: {
    backgroundColor: '#eef4f8',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    padding: 5,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#00365A',
  },
  segmentText: {
    color: '#00365A',
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '900',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  contextText: {
    color: '#617380',
    fontSize: 12,
    lineHeight: 18,
  },
  methodSwitch: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3f7fa',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  methodButton: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  methodButtonActive: {
    backgroundColor: '#ffffff',
    boxShadow: '0px 4px 12px rgba(0, 28, 48, 0.12)',
  },
  methodText: {
    color: '#687784',
    fontSize: 12,
    fontWeight: '900',
  },
  methodTextActive: {
    color: '#00365A',
  },
  accessBlock: {
    gap: 12,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#c9d8e2',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 54,
    paddingHorizontal: 12,
  },
  googleMark: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 22,
    width: 22,
  },
  googleDot: {
    height: 11,
    width: 11,
  },
  googleText: {
    color: '#1f2d38',
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  arrowBubble: {
    alignItems: 'center',
    backgroundColor: '#00365A',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  form: {
    gap: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: '#45525d',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: '#f9fbfd',
    borderColor: '#d8e1e8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 52,
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    backgroundColor: '#ffffff',
    borderColor: '#006CAF',
    boxShadow: '0px 0px 0px 3px rgba(0, 108, 175, 0.15)',
  },
  input: {
    color: '#1f2d38',
    flex: 1,
    fontSize: 15,
    minHeight: 48,
    paddingVertical: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  formActions: {
    alignItems: 'flex-end',
  },
  forgotButton: {
    paddingVertical: 2,
  },
  forgotText: {
    color: '#006CAF',
    fontSize: 13,
    fontWeight: '900',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#00365A',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
  },
  submitButtonDisabled: {
    opacity: 0.72,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  demoButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  demoText: {
    color: '#006CAF',
    fontSize: 12,
    fontWeight: '900',
  },
  errorText: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffd0cc',
    borderRadius: 8,
    borderWidth: 1,
    color: '#9f1f18',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    padding: 10,
  },
  cycleCard: {
    alignItems: 'center',
    backgroundColor: '#f4f9fc',
    borderColor: '#d8edf8',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    padding: 11,
    width: '100%',
  },
  cycleIcon: {
    alignItems: 'center',
    backgroundColor: '#d8edf8',
    borderRadius: 7,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  cycleTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  cycleLabel: {
    color: '#687784',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cycleTitle: {
    color: '#00365A',
    fontSize: 14,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: '#0F7A59',
    borderRadius: 7,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
});
