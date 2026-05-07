import { router, Tabs, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookOpen, CalendarDays, ClipboardCheck, CreditCard, Grid2X2, MessageCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { hasValidatedSession, saveLastPanelPath } from '@/services/api';

export default function PanelTabLayout() {
  const [checkingSession, setCheckingSession] = useState(true);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function guardPanel() {
      try {
        const wasValidatedByApp = await hasValidatedSession();
        if (!wasValidatedByApp) {
          throw new Error('Sesion no validada por la app.');
        }
        if (mounted) {
          setCheckingSession(false);
        }
      } catch {
        if (mounted) {
          router.replace('/');
        }
      }
    }

    guardPanel();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!checkingSession) {
      saveLastPanelPath(pathname).catch(() => undefined);
    }
  }, [checkingSession, pathname]);

  if (checkingSession) {
    return (
      <View style={styles.guardScreen}>
        <ActivityIndicator color="#00365A" size="large" />
        <Text style={styles.guardText}>Abriendo tu pantalla...</Text>
      </View>
    );
  }

  return (
    <View style={styles.panelRoot}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.topStatusBar} />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9bb3c2',
        tabBarStyle: {
          backgroundColor: '#00365A',
          borderTopColor: '#00365A',
          borderTopWidth: 0,
          height: 66 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          marginTop: 2,
        },
        tabBarItemStyle: {
          minWidth: 44,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Foro',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MessageCircle color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="cursos"
        options={{
          title: 'Cursos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <BookOpen color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="horarios"
        options={{
          title: 'Horario',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <CalendarDays color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <CreditCard color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="evaluaciones"
        options={{
          title: 'Tests',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <ClipboardCheck color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <Grid2X2 color={color} size={21} strokeWidth={focused ? 3 : 2.4} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="asistencia" options={{ href: null }} />
      <Tabs.Screen name="docente" options={{ href: null }} />
      <Tabs.Screen name="docente-asistencia" options={{ href: null }} />
      <Tabs.Screen name="docente-horarios" options={{ href: null }} />
      <Tabs.Screen name="docente-recursos" options={{ href: null }} />
      <Tabs.Screen name="perfil" options={{ href: null }} />
      <Tabs.Screen name="reclamaciones" options={{ href: null }} />
      <Tabs.Screen name="ver-publicacion" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

function TabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  return <View style={[styles.iconBubble, focused && styles.iconBubbleActive]}>{children}</View>;
}

const styles = StyleSheet.create({
  panelRoot: { flex: 1 },
  topStatusBar: { backgroundColor: '#00365A' },
  guardScreen: { alignItems: 'center', backgroundColor: '#f3f7fa', flex: 1, gap: 12, justifyContent: 'center' },
  guardText: { color: '#00365A', fontSize: 13, fontWeight: '900' },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 38,
  },
  iconBubbleActive: {
    backgroundColor: '#006CAF',
  },
});
