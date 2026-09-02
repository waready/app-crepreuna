import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  type LucideIcon,
  RefreshCw,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
  View,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { palette, theme } from '@/constants/theme';

type AppTextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption' | 'micro';

export function AppText({
  variant = 'body',
  color = theme.colors.text,
  style,
  ...props
}: TextProps & { variant?: AppTextVariant; color?: string }) {
  return <Text {...props} style={[textStyles[variant], { color }, style]} />;
}

type ScreenProps = React.PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  edges?: Edge[];
}>;

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  contentStyle,
  edges = ['top'],
}: ScreenProps) {
  const content = (
    <>
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientSide} />
      {children}
    </>
  );

  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.screenContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? (
            <RefreshControl
              colors={[theme.colors.accent]}
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={theme.colors.accent}
            />
          ) : undefined}
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.screenContentStatic, contentStyle]}>{content}</View>
      )}
    </SafeAreaView>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  period?: string | null;
  back?: boolean;
  action?: React.ReactNode;
  compact?: boolean;
};

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  period,
  back = false,
  action,
  compact = false,
}: PageHeaderProps) {
  return (
    <LinearGradient
      colors={[palette.navy950, palette.navy800, palette.lake700]}
      end={{ x: 1, y: 1 }}
      start={{ x: 0, y: 0 }}
      style={[styles.header, compact && styles.headerCompact]}>
      <View pointerEvents="none" style={styles.headerOrb} />
      <View style={styles.headerTopRow}>
        {back ? (
          <IconButton
            accessibilityLabel="Volver"
            icon={ArrowLeft}
            onPress={() => router.back()}
            tone="light"
          />
        ) : <View style={styles.headerSpacer} />}
        {period ? <Pill label={period} tone="glass" /> : null}
        {action ?? <View style={styles.headerSpacer} />}
      </View>
      {eyebrow ? <AppText color="#BFE7F5" style={styles.headerEyebrow} variant="micro">{eyebrow}</AppText> : null}
      <AppText color={palette.paper} style={styles.headerTitle} variant="display">{title}</AppText>
      {subtitle ? <AppText color="#D6EDF5" style={styles.headerSubtitle} variant="body">{subtitle}</AppText> : null}
    </LinearGradient>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: React.PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  accessibilityLabel?: string;
}>) {
  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';

export function Button({
  label,
  onPress,
  icon: Icon,
  trailingIcon,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  trailingIcon?: boolean;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const colors = buttonColors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        fullWidth && styles.fullWidth,
        { backgroundColor: colors.background, borderColor: colors.border },
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {loading ? <ActivityIndicator color={colors.foreground} size="small" /> : null}
      {!loading && Icon && !trailingIcon ? <Icon color={colors.foreground} size={18} strokeWidth={2.5} /> : null}
      <AppText color={colors.foreground} numberOfLines={1} variant="label">{label}</AppText>
      {!loading && (trailingIcon || (!Icon && variant === 'ghost')) ? (
        <ChevronRight color={colors.foreground} size={17} strokeWidth={2.5} />
      ) : null}
    </Pressable>
  );
}

export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  tone = 'default',
  badge,
}: {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'default' | 'light' | 'danger';
  badge?: number;
}) {
  const foreground = tone === 'light' ? palette.paper : tone === 'danger' ? theme.colors.danger : theme.colors.primary;
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        tone === 'light' && styles.iconButtonLight,
        tone === 'danger' && styles.iconButtonDanger,
        pressed && styles.pressed,
      ]}>
      <Icon color={foreground} size={20} strokeWidth={2.4} />
      {badge ? (
        <View style={styles.iconBadge}>
          <AppText color={palette.paper} style={styles.iconBadgeText} variant="micro">{badge > 9 ? '9+' : badge}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Field({
  label,
  icon: Icon,
  error,
  hint,
  right,
  containerStyle,
  ...props
}: TextInputProps & {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  right?: React.ReactNode;
  containerStyle?: ViewStyle;
}) {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      {label ? <AppText style={styles.fieldLabel} variant="label">{label}</AppText> : null}
      <View style={[styles.fieldShell, error && styles.fieldShellError, props.multiline && styles.fieldShellMultiline]}>
        {Icon ? <Icon color={theme.colors.textMuted} size={19} strokeWidth={2.2} /> : null}
        <TextInput
          placeholderTextColor="#8A9BA5"
          {...props}
          style={[styles.fieldInput, props.multiline && styles.fieldInputMultiline, props.style]}
        />
        {right}
      </View>
      {error ? <AppText color={theme.colors.danger} variant="caption">{error}</AppText> : null}
      {!error && hint ? <AppText color={theme.colors.textMuted} variant="caption">{hint}</AppText> : null}
    </View>
  );
}

type PillTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'glass';

export function Pill({ label, tone = 'neutral', icon: Icon }: { label: string; tone?: PillTone; icon?: LucideIcon }) {
  const colors = pillColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {Icon ? <Icon color={colors.foreground} size={13} strokeWidth={2.5} /> : null}
      <AppText color={colors.foreground} style={styles.pillText} variant="micro">{label}</AppText>
    </View>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleCopy}>
        <AppText variant="heading">{title}</AppText>
        {subtitle ? <AppText color={theme.colors.textMuted} variant="caption">{subtitle}</AppText> : null}
      </View>
      {action}
    </View>
  );
}

export function Metric({
  label,
  value,
  icon: Icon,
  tone = 'accent',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: 'accent' | 'success' | 'warning' | 'info';
}) {
  const colors = metricColors[tone];
  return (
    <View style={[styles.metric, { backgroundColor: colors.background }]}>
      <View style={[styles.metricIcon, { backgroundColor: colors.iconBackground }]}>
        <Icon color={colors.foreground} size={19} strokeWidth={2.4} />
      </View>
      <AppText color={colors.foreground} variant="title">{value}</AppText>
      <AppText color={theme.colors.textMuted} numberOfLines={2} variant="micro">{label}</AppText>
    </View>
  );
}

export function LoadingState({ label = 'Cargando informacion...' }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIconSoft}>
        <LoaderCircle color={theme.colors.accent} size={26} />
      </View>
      <ActivityIndicator color={theme.colors.accent} />
      <AppText color={theme.colors.textMuted} variant="caption">{label}</AppText>
    </View>
  );
}

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
}: {
  title: string;
  message: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.stateBox}>
      <View style={styles.stateIconSoft}>
        <Icon color={theme.colors.accent} size={28} strokeWidth={2} />
      </View>
      <AppText style={styles.stateTitle} variant="heading">{title}</AppText>
      <AppText color={theme.colors.textMuted} style={styles.stateMessage} variant="body">{message}</AppText>
      {action}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.stateBox}>
      <View style={[styles.stateIconSoft, styles.stateIconDanger]}>
        <AlertCircle color={theme.colors.danger} size={28} strokeWidth={2.2} />
      </View>
      <AppText style={styles.stateTitle} variant="heading">No pudimos cargar esta seccion</AppText>
      <AppText color={theme.colors.textMuted} style={styles.stateMessage} variant="body">{message}</AppText>
      {onRetry ? <Button compact icon={RefreshCw} label="Reintentar" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const buttonColors = {
  primary: { background: theme.colors.primary, foreground: palette.paper, border: theme.colors.primary },
  secondary: { background: theme.colors.surface, foreground: theme.colors.primary, border: theme.colors.borderStrong },
  ghost: { background: 'transparent', foreground: theme.colors.accent, border: 'transparent' },
  danger: { background: theme.colors.dangerSoft, foreground: theme.colors.danger, border: theme.colors.dangerSoft },
  soft: { background: theme.colors.accentSoft, foreground: theme.colors.primary, border: theme.colors.accentSoft },
};

const pillColors = {
  accent: { background: theme.colors.accentSoft, foreground: theme.colors.primary, border: '#C3E5F1' },
  success: { background: theme.colors.successSoft, foreground: theme.colors.success, border: '#C7E8DA' },
  warning: { background: theme.colors.warningSoft, foreground: theme.colors.warning, border: '#F1D8B5' },
  danger: { background: theme.colors.dangerSoft, foreground: theme.colors.danger, border: '#F1C9C4' },
  info: { background: theme.colors.infoSoft, foreground: theme.colors.info, border: '#DCD6F4' },
  neutral: { background: '#EEF3F5', foreground: theme.colors.textSoft, border: theme.colors.border },
  glass: { background: 'rgba(255,255,255,0.14)', foreground: palette.paper, border: 'rgba(255,255,255,0.23)' },
};

const metricColors = {
  accent: { background: '#EAF7FC', iconBackground: '#D1EEF8', foreground: theme.colors.primary },
  success: { background: '#E9F7F1', iconBackground: '#D5EFE4', foreground: theme.colors.success },
  warning: { background: '#FFF6E8', iconBackground: '#F9E8C9', foreground: theme.colors.warning },
  info: { background: '#F3F0FB', iconBackground: '#E6E0F7', foreground: theme.colors.info },
};

const textStyles = StyleSheet.create({
  display: { fontFamily: theme.typography.display, fontSize: 30, lineHeight: 35, letterSpacing: -0.5 },
  title: { fontFamily: theme.typography.extraBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: theme.typography.bold, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },
  body: { fontFamily: theme.typography.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: theme.typography.bold, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: theme.typography.medium, fontSize: 12.5, lineHeight: 18 },
  micro: { fontFamily: theme.typography.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.2 },
});

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.background, flex: 1 },
  screenContent: { flexGrow: 1, paddingBottom: 110 },
  screenContentStatic: { flex: 1 },
  ambientTop: {
    backgroundColor: '#DFF3F7',
    borderRadius: 160,
    height: 240,
    opacity: 0.55,
    position: 'absolute',
    right: -120,
    top: -140,
    width: 240,
  },
  ambientSide: {
    backgroundColor: '#F7EEDC',
    borderRadius: 120,
    height: 190,
    left: -130,
    opacity: 0.38,
    position: 'absolute',
    top: 360,
    width: 190,
  },
  header: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 22,
    overflow: 'hidden',
    paddingBottom: 26,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerCompact: { paddingBottom: 20 },
  headerOrb: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 100,
    height: 180,
    position: 'absolute',
    right: -55,
    top: -85,
    width: 180,
  },
  headerTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42 },
  headerSpacer: { height: 38, width: 38 },
  headerEyebrow: { letterSpacing: 1.1, marginTop: 10, textTransform: 'uppercase' },
  headerTitle: { marginTop: 4, maxWidth: '92%' },
  headerSubtitle: { marginTop: 7, maxWidth: 580 },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginHorizontal: 16,
    padding: 16,
    ...theme.shadow,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: 15, paddingVertical: 8 },
  fullWidth: { alignSelf: 'stretch' },
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  iconButtonLight: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.22)' },
  iconButtonDanger: { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.dangerSoft },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.danger,
    borderColor: palette.paper,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 17,
    justifyContent: 'center',
    minWidth: 17,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -3,
    top: -3,
  },
  iconBadgeText: { fontSize: 8, lineHeight: 10 },
  fieldContainer: { gap: 6, minWidth: 0, width: '100%' },
  fieldLabel: { color: theme.colors.textSoft, marginLeft: 2 },
  fieldShell: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minWidth: 0,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  fieldShellError: { borderColor: theme.colors.danger },
  fieldShellMultiline: { alignItems: 'flex-start', minHeight: 110, paddingTop: 13 },
  fieldInput: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.typography.medium,
    fontSize: 15,
    minWidth: 0,
    minHeight: 50,
  },
  fieldInputMultiline: { minHeight: 90, paddingBottom: 12, textAlignVertical: 'top' },
  pill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    minHeight: 27,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: { textTransform: 'none' },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
    marginHorizontal: 18,
    marginTop: 24,
  },
  sectionTitleCopy: { flex: 1, gap: 2 },
  metric: { borderRadius: theme.radius.md, flex: 1, gap: 7, minHeight: 132, padding: 14 },
  metricIcon: { alignItems: 'center', borderRadius: 12, height: 36, justifyContent: 'center', width: 36 },
  stateBox: { alignItems: 'center', gap: 10, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 44 },
  stateIconSoft: { alignItems: 'center', backgroundColor: theme.colors.accentSoft, borderRadius: 25, height: 52, justifyContent: 'center', width: 52 },
  stateIconDanger: { backgroundColor: theme.colors.dangerSoft },
  stateTitle: { marginTop: 4, textAlign: 'center' },
  stateMessage: { maxWidth: 420, textAlign: 'center' },
  divider: { backgroundColor: theme.colors.border, height: StyleSheet.hairlineWidth, marginVertical: 14 },
});
