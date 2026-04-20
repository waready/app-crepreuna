import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import CookieManager from '@react-native-cookies/cookies';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { markNetworkFailure, markNetworkSuccess } from '@/services/connectivity';

const REMOTE_API_BASE_URL = 'https://back.waready.org.pe';

export const API_BASE_URL =
  Platform.OS === 'web' ? (process.env.EXPO_PUBLIC_API_BASE_URL ?? '') : REMOTE_API_BASE_URL;

const SESSION_KEY = 'cepreuna_session_id';
const SESSION_VALIDATED_KEY = 'cepreuna_session_validated';
const LAST_PANEL_PATH_KEY = 'cepreuna_last_panel_path';
const NATIVE_SESSION_MAX_AGE_DAYS = 7;
let memorySessionId: string | null = null;
let memorySessionValidated = false;
let memoryLastPanelPath: string | null = null;
let redirectingToLogin = false;

type LoginPayload = {
  email: string;
  password: string;
};

type VoucherPayload = {
  pagarEnPagalo: boolean;
  secuencia: string;
  monto: string | number;
  fecha: string;
  documento: string;
  file: {
    uri: string;
    name?: string;
    type?: string;
  };
};

type PublicacionPayload = {
  usuario: string;
  texto: string;
  tipo: number;
  imagen?: {
    uri: string;
    name?: string;
    type?: string;
  } | null;
};

type VocationalAnswerPayload = {
  estudiante_id: number;
  estudiante_nombre: string;
  estudiante_dni: string;
  puntaje_ingeneria: number;
  puntaje_biologia: number;
  puntaje_sociales: number;
  detalles: Array<{
    nro_documento: string;
    puntaje: number;
    tipo: string;
    preguntas_id: number;
    respuesta_id: number;
  }>;
};

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const sessionId = await getSessionId();
  if (sessionId) {
    config.headers.set('X-Session-ID', sessionId);
  }
  if (sessionId && Platform.OS !== 'web') {
    config.headers.set('Cookie', `session_id=${sessionId}`);
  }
  return config;
});

client.interceptors.response.use(
  async (response) => {
    markNetworkSuccess();
    const sessionId = readSessionFromHeaders(response.headers);
    if (sessionId) {
      await setSessionId(sessionId);
    }
    await redirectIfSessionExpired(response);
    return response;
  },
  async (error: AxiosError) => {
    if (isNetworkAxiosError(error)) {
      markNetworkFailure();
    }
    const message = extractErrorMessage(error);
    const requestUrl = String(error.config?.url ?? '');
    const isLoginRequest = requestUrl.includes('/api/login');
    if (!isLoginRequest && (isSessionExpiredMessage(message) || error.response?.status === 401 || error.response?.status === 403)) {
      await handleSessionExpired();
      return Promise.reject(new SessionExpiredError());
    }
    return Promise.reject(new Error(message));
  }
);

export const api = {
  async login(payload: LoginPayload) {
    await clearSessionId();
    if (Platform.OS !== 'web' && await readNativeSessionCookie()) {
      throw new Error('No se pudo limpiar la sesion anterior. Cierra la app o reinstala el APK e intenta nuevamente.');
    }
    const { data, headers } = await client.post('/api/login', payload);
    if (!isSuccessfulLoginResponse(data)) {
      throw new Error(extractLoginFailureMessage(data) ?? 'Credenciales incorrectas o sesion no valida.');
    }
    const sessionId = readSessionFromHeaders(headers) ?? readSessionFromBody(data);
    if (!sessionId) {
      await clearSessionId();
      throw new Error('Login correcto, pero el backend no envio session_id para Android. Agrega session_id en el JSON o expone Set-Cookie.');
    }
    await setSessionId(sessionId);
    return data;
  },

  async logout() {
    const { data } = await client.post('/api/logout');
    await clearSessionId();
    return data;
  },

  async verifySession() {
    const data = await get('/api/verify-session');
    if (!isValidSessionResponse(data)) {
      throw new Error('Sesion no valida o expirada.');
    }
    return data;
  },
  async validateAuthenticatedAccess() {
    const [session, profile] = await Promise.all([api.verifySession(), api.getPerfil()]);
    if (!isValidSessionResponse(session) || isSessionExpiredPayload(profile) || hasApiError(profile)) {
      throw new Error(extractApiMessage(profile) ?? 'No se pudo validar el acceso del usuario.');
    }
    return { session, profile };
  },
  getHorario: () => get('/api/horario'),
  getCarga: () => get('/api/carga'),
  getAsistencias: () => get('/api/asistencias'),
  getRangoFechas: () => get('/api/rango-fechas'),
  getCuadernillos: () => get('/api/cuadernillos'),
  getCuadernillosFormat: () => get('/api/cuadernillos-format'),
  getTemarios: () => get('/api/temarios'),
  getCriteriosDocente: (modalidad = 1) => get('/api/criterios-docente', { params: { modalidad } }),
  getPublicaciones: (page = 1, tipo = 1) => get('/api/publicaciones', { params: { page, tipo } }),
  getDashboard: () => get('/api/page/dashboard'),
  getPerfil: () => get('/api/page/perfil'),
  getPageHorarios: () => get('/api/page/horarios'),
  getMisCursos: () => get('/api/page/mis-cursos'),
  getPageCuadernillos: () => get('/api/page/cuadernillos'),
  getPageAsistencias: () => get('/api/page/asistencias'),
  getPagePagos: () => get('/api/page/pagos'),
  getPreguntas: () => get('/api/preguntas'),
  getRespuestas: () => get('/api/respuestas'),
  getRespuestasDetalle: () => get('/api/respuestas-detalle'),
  getConstancia: (estudianteId: number) => get(`/api/page/constancia/${estudianteId}`),

  async validarCuota(userId: number, payload: VoucherPayload) {
    const formData = new FormData();
    formData.append('pagarEnPagalo', String(payload.pagarEnPagalo));
    formData.append('secuencia', payload.secuencia);
    formData.append('monto', String(payload.monto));
    formData.append('fecha', payload.fecha);
    formData.append('documento', payload.documento);
    formData.append('file', toUploadFile(payload.file));

    const { data } = await client.post(`/api/pagos/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async registrarPago(tokens: string[]) {
    const { data } = await client.post('/api/registrar-pago', { tokens });
    return data;
  },

  async crearPublicacion(payload: PublicacionPayload) {
    const formData = new FormData();
    formData.append('usuario', payload.usuario);
    formData.append('texto', payload.texto);
    formData.append('tipo', String(payload.tipo));
    if (payload.imagen) {
      formData.append('imagen', toUploadFile(payload.imagen));
    }

    const { data } = await client.post('/api/crear-publicacion', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async crearPregunta(payload: { denominacion: string; tipo: string; area: string; puntaje: number }) {
    const formData = toUrlEncoded(payload);
    const { data } = await client.post('/api/preguntas', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },

  async crearRespuesta(payload: {
    estudiante_id: number;
    estudiante_nombre: string;
    estudiante_dni: string;
    puntaje_ingeneria: number;
    puntaje_biologia: number;
    puntaje_sociales: number;
  }) {
    const formData = toUrlEncoded(payload);
    const { data } = await client.post('/api/respuestas', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },

  async crearRespuestaDetalle(payload: {
    nro_documento: string;
    puntaje: number;
    tipo: string;
    preguntas_id: number;
    respuesta_id: number;
  }) {
    const formData = toUrlEncoded(payload);
    const { data } = await client.post('/api/respuestas-detalle', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },

  async crearRespuestaCompleta(payload: VocationalAnswerPayload) {
    const { data } = await client.post('/api/respuestasAll', payload);
    return data;
  },

  async comprobarRespuesta(dni: string) {
    const formData = toUrlEncoded({ dni });
    const { data } = await client.post('/api/respuestas/comprobar', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },
};

async function get(path: string, config?: AxiosRequestConfig) {
  const { data } = await client.get(path, config);
  return data;
}

class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED_REDIRECT');
    this.name = 'SessionExpiredError';
  }
}

async function redirectIfSessionExpired(response: AxiosResponse) {
  if (isSessionExpiredPayload(response.data)) {
    await handleSessionExpired();
    throw new SessionExpiredError();
  }
}

function isSessionExpiredPayload(data: unknown) {
  const message = extractApiMessage(data);
  return Boolean(message && isSessionExpiredMessage(message));
}

function isSessionExpiredMessage(message: string) {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return normalized.includes('sesion no valida')
    || normalized.includes('sesion expirada')
    || normalized.includes('session expired')
    || normalized.includes('session_expired');
}

async function handleSessionExpired() {
  await clearSessionId();
  if (!redirectingToLogin) {
    redirectingToLogin = true;
    router.replace('/');
    setTimeout(() => {
      redirectingToLogin = false;
    }, 1200);
  }
}

function readSessionFromHeaders(headers: AxiosRequestConfig['headers']) {
  const cookieHeader = headers?.['set-cookie'] ?? headers?.['Set-Cookie'];
  const cookieText = Array.isArray(cookieHeader) ? cookieHeader.join(';') : String(cookieHeader ?? '');
  const match = cookieText.match(/session_id=([^;]+)/);
  return match?.[1] ?? null;
}

function readSessionFromBody(data: unknown) {
  return findSessionValue(data);
}

function extractApiMessage(data: unknown) {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') {
      return record.error;
    }
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.detail === 'string') {
      return record.detail;
    }
  }
  return null;
}

function extractErrorMessage(error: AxiosError) {
  if (isNetworkAxiosError(error)) {
    return 'Sin conexion a internet. Revisa tus datos o Wi-Fi e intenta nuevamente.';
  }

  const data = error.response?.data;
  if (data && typeof data === 'object') {
    const directError = (data as { error?: unknown }).error;
    if (typeof directError === 'string') {
      return directError;
    }
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object') {
      return String((detail[0] as { msg?: string }).msg ?? 'Error de validacion');
    }
  }
  return error.message || 'No se pudo conectar con el servidor';
}

function isValidSessionResponse(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const record = data as Record<string, unknown>;
  return record.success === true;
}

function isSuccessfulLoginResponse(data: unknown) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const record = data as Record<string, unknown>;
  if (record.success !== true || record.error) {
    return false;
  }
  if ('cuadernillo' in record && !record.cuadernillo) {
    return false;
  }
  return true;
}

function isNetworkAxiosError(error: AxiosError) {
  const message = String(error.message).toLowerCase();
  return !error.response
    || error.code === 'ERR_NETWORK'
    || error.code === 'ECONNABORTED'
    || message.includes('network')
    || message.includes('timeout');
}

function extractLoginFailureMessage(data: unknown) {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.error === 'string') {
      return record.error;
    }
    if (record.success === false && typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.detail === 'string') {
      return record.detail;
    }
  }
  return null;
}

function hasApiError(data: unknown) {
  return Boolean(extractApiMessage(data));
}

function findSessionValue(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const directValue =
    record.session_id ??
    record.sessionId ??
    record.session ??
    record.token ??
    record.access_token ??
    record.accessToken;

  if (typeof directValue === 'string' && directValue.trim()) {
    return directValue;
  }

  for (const nestedValue of Object.values(record)) {
    if (nestedValue && typeof nestedValue === 'object') {
      const found = findSessionValue(nestedValue);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function toUrlEncoded(payload: Record<string, string | number | boolean>) {
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => form.append(key, String(value)));
  return form.toString();
}

function toUploadFile(file: VoucherPayload['file']) {
  return {
    uri: file.uri,
    name: file.name ?? 'voucher.jpg',
    type: file.type ?? 'image/jpeg',
  } as unknown as Blob;
}

async function setSessionId(sessionId: string) {
  memorySessionId = sessionId;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, sessionId);
  } else {
    await setNativePersistentCookie('session_id', sessionId);
  }
}

export async function getSessionId() {
  if (memorySessionId) {
    return memorySessionId;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    memorySessionId = window.localStorage.getItem(SESSION_KEY);
  } else {
    memorySessionId = await readNativeSessionCookie();
  }
  return memorySessionId;
}

export async function markSessionValidated() {
  memorySessionValidated = true;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_VALIDATED_KEY, 'true');
  }
}

export async function saveLastPanelPath(path: string) {
  if (!path.startsWith('/panel')) {
    return;
  }
  memoryLastPanelPath = path;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(LAST_PANEL_PATH_KEY, path);
  } else {
    await setNativePersistentCookie(LAST_PANEL_PATH_KEY, encodeURIComponent(path));
  }
}

export async function getLastPanelPath() {
  if (memoryLastPanelPath?.startsWith('/panel')) {
    return memoryLastPanelPath;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    memoryLastPanelPath = window.localStorage.getItem(LAST_PANEL_PATH_KEY) ?? '/panel';
  } else {
    const value = await readNativeCookie(LAST_PANEL_PATH_KEY);
    try {
      memoryLastPanelPath = value ? decodeURIComponent(value) : '/panel';
    } catch {
      memoryLastPanelPath = '/panel';
    }
  }
  return memoryLastPanelPath?.startsWith('/panel') ? memoryLastPanelPath : '/panel';
}

export async function hasValidatedSession() {
  if (memorySessionValidated) {
    return true;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    memorySessionValidated = window.localStorage.getItem(SESSION_VALIDATED_KEY) === 'true';
  } else {
    // En Android una suspension puede matar el JS runtime y perder los flags en memoria.
    // Si existe la cookie local, dejamos que el guard valide contra el backend.
    memorySessionValidated = Boolean(await getSessionId());
  }
  return memorySessionValidated;
}

export async function clearSessionId() {
  memorySessionId = null;
  memorySessionValidated = false;
  memoryLastPanelPath = null;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(SESSION_VALIDATED_KEY);
    window.localStorage.removeItem(LAST_PANEL_PATH_KEY);
  } else {
    await CookieManager.clearByName(REMOTE_API_BASE_URL, 'session_id', true).catch(() => undefined);
    await CookieManager.clearByName(REMOTE_API_BASE_URL, 'session_id', false).catch(() => undefined);
    await CookieManager.clearAll(true);
    await CookieManager.clearAll(false);
  }
}

async function readNativeSessionCookie() {
  return readNativeCookie('session_id');
}

async function readNativeCookie(name: string) {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const cookies = await CookieManager.get(REMOTE_API_BASE_URL);
    return cookies[name]?.value ?? null;
  } catch {
    return null;
  }
}

async function setNativePersistentCookie(name: string, value: string) {
  const expires = new Date(Date.now() + NATIVE_SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace('Z', '+00:00');
  await CookieManager.set(REMOTE_API_BASE_URL, {
    name,
    value,
    domain: 'back.waready.org.pe',
    path: '/',
    version: '1',
    expires,
    secure: true,
  });
}
