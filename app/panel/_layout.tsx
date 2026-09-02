import { router, Tabs } from 'expo-router';
import {
  BookOpenText,
  CalendarDays,
  CreditCard,
  Grid2X2,
  MessageCircleMore,
  PanelsTopLeft,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AppText } from '@/components/ui/primitives';
import { palette, theme } from '@/constants/theme';
import { useSession } from '@/providers/session-provider';

export default function PanelTabLayout() {
  const insets = useSafeAreaInsets();
  const { status, role } = useSession();

  useEffect(() => {
    if (status === 'anonymous') router.replace('/');
  }, [status]);

  if (status !== 'authenticated' || !role) {
    return (
      <View style={styles.guardScreen}>
        <View style={styles.guardMark}>
          <PanelsTopLeft color={palette.paper} size={28} />
        </View>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <AppText color={theme.colors.textMuted} variant="caption">Preparando tu campus...</AppText>
      </View>
    );
  }

  const teacher = role === 'docente';

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.colors.background },
        tabBarActiveTintColor: palette.paper,
        tabBarInactiveTintColor: '#8FB0C0',
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: [
          styles.tabBar,
          {
            height: 67 + Math.max(insets.bottom, 8),
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Foro',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={MessageCircleMore} />
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={BookOpenText} />
          ),
        }}
      />
      <Tabs.Screen
        name="horarios"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={CalendarDays} />
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          href: teacher ? null : '/panel/pagos',
          title: 'Pagos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={CreditCard} />
          ),
        }}
      />
      <Tabs.Screen
        name="docente-recursos"
        options={{
          href: teacher ? '/panel/docente-recursos' : null,
          title: 'Recursos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={PanelsTopLeft} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon active={focused} color={color} icon={Grid2X2} />
          ),
        }}
      />

      <Tabs.Screen name="asistencia" options={{ href: null }} />
      <Tabs.Screen name="docente" options={{ href: null }} />
      <Tabs.Screen name="docente-asistencia" options={{ href: null }} />
      <Tabs.Screen name="docente-horarios" options={{ href: null }} />
      <Tabs.Screen name="evaluaciones" options={{ href: null }} />
      <Tabs.Screen name="materiales" options={{ href: null }} />
      <Tabs.Screen name="notificaciones" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ href: null }} />
      <Tabs.Screen name="preguntas" options={{ href: null }} />
      <Tabs.Screen name="sesiones" options={{ href: null }} />
      <Tabs.Screen name="test-vocacional" options={{ href: null }} />
      <Tabs.Screen name="ver-publicacion" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  active,
  color,
  icon: Icon,
}: {
  active: boolean;
  color: string;
  icon: typeof MessageCircleMore;
}) {
  return (
    <View style={[styles.tabIcon, active && styles.tabIconActive]}>
      <Icon color={color} size={21} strokeWidth={active ? 2.8 : 2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  guardScreen: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  guardMark: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 22,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  tabBar: {
    backgroundColor: palette.navy950,
    borderTopColor: '#164C68',
    borderTopWidth: 1,
    paddingHorizontal: 4,
    paddingTop: 7,
  },
  tabItem: { minWidth: 52 },
  tabLabel: {
    fontFamily: theme.typography.bold,
    fontSize: 9.5,
    marginTop: 1,
  },
  tabIcon: {
    alignItems: 'center',
    borderRadius: 13,
    height: 32,
    justifyContent: 'center',
    width: 42,
  },
  tabIconActive: {
    backgroundColor: palette.lake700,
    borderColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
  },
});
