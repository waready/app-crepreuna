import { Platform } from 'react-native';

export const palette = {
  navy950: '#05253A',
  navy900: '#073957',
  navy800: '#0A496D',
  lake700: '#006FA6',
  lake600: '#078BC4',
  lake100: '#DDF3FB',
  lake50: '#EFF9FD',
  ink900: '#172633',
  ink700: '#405361',
  ink500: '#6C7E89',
  paper: '#FFFFFF',
  canvas: '#F3F7F8',
  line: '#DCE7EB',
  lineStrong: '#C7D7DD',
  gold600: '#B76A16',
  gold100: '#FBEBD4',
  green700: '#0B7555',
  green100: '#DDF4EA',
  red700: '#B83232',
  red100: '#FBE5E2',
  violet700: '#6255A5',
  violet100: '#ECE9FA',
  scrim: 'rgba(5, 37, 58, 0.58)',
} as const;

export const theme = {
  colors: {
    primary: palette.navy900,
    primaryStrong: palette.navy950,
    accent: palette.lake600,
    accentSoft: palette.lake100,
    background: palette.canvas,
    surface: palette.paper,
    surfaceMuted: palette.lake50,
    text: palette.ink900,
    textMuted: palette.ink500,
    textSoft: palette.ink700,
    border: palette.line,
    borderStrong: palette.lineStrong,
    success: palette.green700,
    successSoft: palette.green100,
    warning: palette.gold600,
    warningSoft: palette.gold100,
    danger: palette.red700,
    dangerSoft: palette.red100,
    info: palette.violet700,
    infoSoft: palette.violet100,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    jumbo: 40,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
    pill: 999,
  },
  typography: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
    display: 'Fraunces_700Bold',
  },
  shadow: Platform.select({
    ios: {
      shadowColor: palette.navy950,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
    },
    android: { elevation: 3 },
    default: {
      boxShadow: '0 10px 30px rgba(5, 37, 58, 0.08)',
    },
  }),
} as const;

export const navigationTheme = {
  dark: false,
  colors: {
    primary: theme.colors.accent,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.danger,
  },
  fonts: {
    regular: { fontFamily: theme.typography.regular, fontWeight: '400' as const },
    medium: { fontFamily: theme.typography.semibold, fontWeight: '600' as const },
    bold: { fontFamily: theme.typography.bold, fontWeight: '700' as const },
    heavy: { fontFamily: theme.typography.extraBold, fontWeight: '800' as const },
  },
};

export const Colors = {
  light: {
    text: theme.colors.text,
    background: theme.colors.background,
    tint: theme.colors.accent,
    icon: theme.colors.textMuted,
    tabIconDefault: '#93AAB6',
    tabIconSelected: theme.colors.surface,
  },
  dark: {
    text: theme.colors.text,
    background: theme.colors.background,
    tint: theme.colors.accent,
    icon: theme.colors.textMuted,
    tabIconDefault: '#93AAB6',
    tabIconSelected: theme.colors.surface,
  },
};

export const Fonts = {
  sans: theme.typography.regular,
  serif: theme.typography.display,
  rounded: theme.typography.semibold,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};
