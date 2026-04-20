import { Platform } from 'react-native';

type ConnectivityState = {
  hasChecked: boolean;
  isChecking: boolean;
  isOffline: boolean;
  lastOnlineAt: number | null;
  lastOfflineAt: number | null;
};

type ConnectivityListener = (state: ConnectivityState) => void;

const REMOTE_API_BASE_URL = 'https://back.waready.org.pe';
const PING_PATH = '/api/verify-session';
const PING_URL = Platform.OS === 'web'
  ? `${process.env.EXPO_PUBLIC_API_BASE_URL ?? ''}${PING_PATH}`
  : `${REMOTE_API_BASE_URL}${PING_PATH}`;
const CHECK_INTERVAL_MS = 8000;
const CHECK_TIMEOUT_MS = 5000;

let monitorId: ReturnType<typeof setInterval> | null = null;
let activeCheck: Promise<boolean> | null = null;
let state: ConnectivityState = {
  hasChecked: false,
  isChecking: false,
  isOffline: false,
  lastOnlineAt: null,
  lastOfflineAt: null,
};
const listeners = new Set<ConnectivityListener>();

export function subscribeConnectivity(listener: ConnectivityListener) {
  listeners.add(listener);
  listener(state);
  return () => {
    listeners.delete(listener);
  };
}

export function getConnectivityState() {
  return state;
}

export function startConnectivityMonitor() {
  if (!monitorId) {
    checkConnectivity();
    monitorId = setInterval(() => {
      checkConnectivity();
    }, CHECK_INTERVAL_MS);
  }

  return () => {
    if (monitorId) {
      clearInterval(monitorId);
      monitorId = null;
    }
  };
}

export function markNetworkFailure() {
  updateState({
    hasChecked: true,
    isChecking: false,
    isOffline: true,
    lastOfflineAt: Date.now(),
  });
}

export function markNetworkSuccess() {
  updateState({
    hasChecked: true,
    isChecking: false,
    isOffline: false,
    lastOnlineAt: Date.now(),
  });
}

export async function checkConnectivity() {
  if (activeCheck) {
    return activeCheck;
  }

  activeCheck = runConnectivityCheck().finally(() => {
    activeCheck = null;
  });
  return activeCheck;
}

async function runConnectivityCheck() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    markNetworkFailure();
    return false;
  }

  updateState({ isChecking: true });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    await fetch(PING_URL, {
      cache: 'no-store',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      method: 'GET',
      signal: controller.signal,
    });
    markNetworkSuccess();
    return true;
  } catch {
    markNetworkFailure();
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function updateState(partial: Partial<ConnectivityState>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener(state));
}
