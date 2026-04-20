import { router, usePathname } from 'expo-router';
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, clearSessionId, getSessionId } from '@/services/api';
import {
  checkConnectivity,
  startConnectivityMonitor,
  subscribeConnectivity,
} from '@/services/connectivity';

type BannerMode = 'offline' | 'checking' | 'online' | null;

type ConnectivityState = {
  hasChecked: boolean;
  isChecking: boolean;
  isOffline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
};

export function ConnectivityBanner() {
  const [connectivity, setConnectivity] = useState<ConnectivityState>({
    hasChecked: false,
    isChecking: false,
    isOffline: false,
    lastOnlineAt: null,
    lastOfflineAt: null,
  });
  const [validatingSession, setValidatingSession] = useState(false);
  const [onlineNotice, setOnlineNotice] = useState(false);
  const wasOfflineRef = useRef(false);
  const validatingRef = useRef(false);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const stopMonitor = startConnectivityMonitor();
    const unsubscribe = subscribeConnectivity(setConnectivity);
    const appStateSubscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        checkConnectivity();
      }
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      stopMonitor();
    };
  }, []);

  const validateSessionAfterReconnect = useCallback(async () => {
    validatingRef.current = true;
    setValidatingSession(true);
    try {
      const hasSession = Boolean(await getSessionId());
      if (hasSession && pathname.startsWith('/panel')) {
        await api.verifySession();
      }
      setOnlineNotice(true);
      setTimeout(() => setOnlineNotice(false), 2800);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (!message.includes('sin conexion') && !message.includes('network') && !message.includes('timeout')) {
        await clearSessionId();
        router.replace('/');
      }
    } finally {
      validatingRef.current = false;
      setValidatingSession(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!connectivity.hasChecked) {
      return;
    }

    if (connectivity.isOffline) {
      wasOfflineRef.current = true;
      setOnlineNotice(false);
      return;
    }

    if (!wasOfflineRef.current || validatingRef.current) {
      return;
    }

    wasOfflineRef.current = false;
    validateSessionAfterReconnect();
  }, [connectivity.hasChecked, connectivity.isOffline, connectivity.lastOnlineAt, validateSessionAfterReconnect]);

  const mode: BannerMode = connectivity.isOffline ? 'offline' : validatingSession ? 'checking' : onlineNotice ? 'online' : null;
  if (!mode) {
    return null;
  }

  const isOffline = mode === 'offline';
  const isChecking = mode === 'checking';

  return (
    <View pointerEvents="box-none" style={[styles.overlay, { paddingTop: insets.top + 8 }]}>
      <View style={[styles.banner, isOffline ? styles.bannerOffline : isChecking ? styles.bannerChecking : styles.bannerOnline]}>
        <View style={[styles.iconBubble, isOffline ? styles.iconOffline : isChecking ? styles.iconChecking : styles.iconOnline]}>
          {isOffline ? <WifiOff color="#ffffff" size={19} /> : isChecking ? <ActivityIndicator color="#ffffff" size="small" /> : <CheckCircle2 color="#ffffff" size={19} />}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{isOffline ? 'Sin conexion a internet' : isChecking ? 'Conexion restablecida' : 'Conexion activa'}</Text>
          <Text style={styles.message}>
            {isOffline
              ? 'Puedes seguir viendo esta pantalla. Al volver la red validaremos tu sesion automaticamente.'
              : isChecking
                ? 'Verificando que tu sesion siga vigente antes de continuar.'
                : 'Todo listo. Puedes continuar donde estabas.'}
          </Text>
        </View>
        {isOffline ? (
          <Pressable style={styles.retryButton} onPress={() => checkConnectivity()}>
            <RefreshCw color="#7A4E00" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    left: 0,
    paddingHorizontal: 12,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  banner: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    boxShadow: '0px 14px 30px rgba(0, 18, 31, 0.20)',
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  bannerOffline: {
    backgroundColor: '#fff8e8',
    borderColor: '#f0d58d',
  },
  bannerChecking: {
    backgroundColor: '#eaf6fc',
    borderColor: '#bfe8ff',
  },
  bannerOnline: {
    backgroundColor: '#ebf8f2',
    borderColor: '#bde8d0',
  },
  iconBubble: {
    alignItems: 'center',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  iconOffline: {
    backgroundColor: '#B77900',
  },
  iconChecking: {
    backgroundColor: '#006CAF',
  },
  iconOnline: {
    backgroundColor: '#0F7A59',
  },
  copy: {
    flex: 1,
  },
  title: {
    color: '#00365A',
    fontSize: 13,
    fontWeight: '900',
  },
  message: {
    color: '#45525d',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    marginTop: 2,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
