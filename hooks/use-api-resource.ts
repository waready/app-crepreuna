import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getConnectivityState, subscribeConnectivity } from '@/services/connectivity';

type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useApiResource<T>(loader: () => Promise<T>, enabled = true): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<T | null>(null);
  const lastRefreshAtRef = useRef(0);
  const wasOfflineRef = useRef(getConnectivityState().isOffline);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }
    const now = Date.now();
    if (now - lastRefreshAtRef.current < 600) {
      return;
    }
    lastRefreshAtRef.current = now;

    setLoading(true);
    setError(null);
    let keepLoading = false;
    try {
      const result = await loader();
      dataRef.current = result;
      setData(result);
    } catch (requestError) {
      if (requestError instanceof Error && requestError.message === 'SESSION_EXPIRED_REDIRECT') {
        setError(null);
        return;
      }
      const message = requestError instanceof Error ? requestError.message : 'No se pudo cargar la informacion';
      if (message.toLowerCase().includes('sin conexion')) {
        setError(null);
        keepLoading = !dataRef.current;
        return;
      }
      setError(message);
    } finally {
      if (!keepLoading) {
        setLoading(false);
      }
    }
  }, [enabled, loader]);

  useEffect(() => {
    const unsubscribe = subscribeConnectivity((state) => {
      if (!enabled) {
        return;
      }

      if (state.isOffline) {
        wasOfflineRef.current = true;
        setError(null);
        if (!dataRef.current) {
          setLoading(true);
        }
        return;
      }

      if (state.hasChecked && wasOfflineRef.current) {
        wasOfflineRef.current = false;
        refresh();
      }
    });

    return unsubscribe;
  }, [enabled, refresh]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      const connectivity = getConnectivityState();
      if (connectivity.isOffline) {
        wasOfflineRef.current = true;
        setError(null);
        if (!dataRef.current) {
          setLoading(true);
        }
      } else {
        refresh();
      }

      return undefined;
    }, [enabled, refresh])
  );

  return { data, loading, error, refresh };
}
