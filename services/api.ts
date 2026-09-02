import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  AcademicMaterial,
  AttendanceItem,
  Comment,
  CourseCriterion,
  DashboardData,
  NotificationItem,
  PaginationMeta,
  PaymentValidation,
  PaymentsData,
  Period,
  Publication,
  QuestionBatch,
  QuestionCourse,
  SessionData,
  StudentAttendance,
  StudentCourse,
  StudentSchedule,
  TeacherCourse,
  TeacherSchedule,
  TeacherSession,
  TeacherStudent,
  UploadFile,
  UserProfile,
  UserRole,
  VocationalTest,
} from '@/services/api-types';

const DEFAULT_API_BASE_URL = 'https://sistemas.cepreuna.edu.pe/api/app/v1';
const TOKEN_KEY = 'cepreuna_app_access_token_v1';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

let memoryToken: string | null = null;
const unauthorizedListeners = new Set<() => void>();

export class ApiError extends Error {
  status?: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type ApiEnvelope<T> = { data: T; message?: string };
type PagedEnvelope<T> = { data: T[]; meta: PaginationMeta };

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(apiError);
  }
);

export const api = {
  auth: {
    async login(payload: { usuario: string; password: string; rol?: UserRole }) {
      await clearAccessToken();
      const data = await post<SessionData>('/auth/login', payload);
      await setAccessToken(data.access_token);
      return data;
    },
    async google(payload: { id_token: string; rol?: UserRole }) {
      await clearAccessToken();
      const data = await post<SessionData>('/auth/google', payload);
      await setAccessToken(data.access_token);
      return data;
    },
    async me() {
      return get<{ usuario: UserProfile; periodo: Period }>('/auth/me');
    },
    async logout() {
      try {
        await postMessage('/auth/logout');
      } finally {
        await clearAccessToken();
      }
    },
    guardianRelations: () => get<Array<{ id: number; denominacion: string }>>('/auth/apoderado/parentescos'),
    async guardian(payload: Record<string, string | number>) {
      await clearAccessToken();
      const data = await post<SessionData>('/auth/apoderado', payload);
      await setAccessToken(data.access_token);
      return data;
    },
  },

  dashboard: () => get<DashboardData>('/dashboard'),
  period: () => get<Period>('/periodo'),

  profile: {
    show: () => get<UserProfile>('/perfil'),
    update: (payload: Partial<Pick<UserProfile, 'celular' | 'email' | 'direccion' | 'fecha_nac' | 'anio_egreso'>>) =>
      patch<UserProfile>('/perfil', payload),
    confirm: () => postMessage('/perfil/confirmar'),
    async updatePhoto(file: UploadFile) {
      const form = new FormData();
      await appendUpload(form, 'foto', file);
      return postForm<UserProfile>('/perfil/foto', form);
    },
    photoUrl: () => absoluteApiUrl('/perfil/foto'),
  },

  student: {
    schedule: () => get<StudentSchedule>('/estudiante/horario'),
    attendance: () => get<StudentAttendance>('/estudiante/asistencias'),
    courses: () => get<StudentCourse[]>('/estudiante/cursos'),
    criteria: (loadId: number) => get<CourseCriterion[]>(`/estudiante/cursos/${loadId}/criterios`),
    rateTeacher: (loadId: number, respuestas: Array<{ criterio_id: number; puntaje: number }>) =>
      postMessage(`/estudiante/cursos/${loadId}/calificacion`, { respuestas }),
    booklets: () => get<AcademicMaterial[]>('/estudiante/cuadernillos'),
    syllabi: () => get<AcademicMaterial[]>('/estudiante/temarios'),
    payments: () => get<PaymentsData>('/estudiante/pagos'),
    validatePayment: (payload: PaymentFormFields) =>
      post<PaymentValidation>('/estudiante/pagos/validar', payload),
    async submitPayment(payload: PaymentFormFields & { voucher: UploadFile }) {
      const form = paymentForm(payload);
      await appendUpload(form, 'voucher', payload.voucher);
      return postMessage('/estudiante/pagos', form);
    },
    test: () => get<VocationalTest>('/estudiante/test-vocacional'),
    submitTest: (respuestas: Array<{ pregunta_id: number; respuesta: boolean }>) =>
      postMessage('/estudiante/test-vocacional', { respuestas }),
    testCertificateUrl: () => absoluteApiUrl('/estudiante/test-vocacional/constancia'),
    enrollmentCertificateUrl: () => absoluteApiUrl('/estudiante/constancia-matricula'),
  },

  teacher: {
    schedule: () => get<TeacherSchedule>('/docente/horario'),
    attendance: () => get<AttendanceItem[]>('/docente/asistencias'),
    courses: () => get<TeacherCourse[]>('/docente/cursos'),
    updateMeet: (loadId: number, meetUrl: string) =>
      patchMessage(`/docente/cursos/${loadId}/meet`, { meet_url: meetUrl }),
    students: (loadId: number) => get<TeacherStudent[]>(`/docente/cursos/${loadId}/estudiantes`),
    booklets: () => get<AcademicMaterial[]>('/docente/cuadernillos'),
    syllabi: () => get<AcademicMaterial[]>('/docente/temarios'),
    sessions: (loadId?: number) =>
      get<TeacherSession[]>('/docente/sesiones', loadId ? { params: { carga_id: loadId } } : undefined),
    session: (id: number) => get<TeacherSession>(`/docente/sesiones/${id}`),
    createSession: (payload: TeacherSessionPayload) => postMessage('/docente/sesiones', payload),
    updateSession: (id: number, payload: TeacherSessionPayload) =>
      putMessage(`/docente/sesiones/${id}`, payload),
    deleteSession: (id: number) => deleteMessage(`/docente/sesiones/${id}`),
    questionCourses: () => get<QuestionCourse[]>('/docente/banco-preguntas/cursos'),
    questionBatches: () => get<QuestionBatch[]>('/docente/banco-preguntas'),
    questionTemplateUrl: () => absoluteApiUrl('/docente/banco-preguntas/plantilla'),
    async submitQuestions(payload: {
      curso_id: number;
      semana: number;
      nivel: string;
      archivo: UploadFile;
    }) {
      const form = new FormData();
      form.append('curso_id', String(payload.curso_id));
      form.append('semana', String(payload.semana));
      form.append('nivel', payload.nivel);
      await appendUpload(form, 'archivo', payload.archivo);
      return postMessage('/docente/banco-preguntas', form);
    },
    deleteQuestions: (id: number) => deleteMessage(`/docente/banco-preguntas/${id}`),
  },

  social: {
    publications: (page = 1, type: '1' | '2' = '1') =>
      getPage<Publication>('/social/publicaciones', { params: { page, tipo: type, per_page: 15 } }),
    publication: (id: number) => get<Publication>(`/social/publicaciones/${id}`),
    async createPublication(payload: { texto: string; tipo?: '1' | '2'; imagen?: UploadFile | null; archivo?: UploadFile | null }) {
      const form = new FormData();
      form.append('texto', payload.texto);
      form.append('tipo', payload.tipo ?? '1');
      if (payload.imagen) await appendUpload(form, 'imagen', payload.imagen);
      if (payload.archivo) await appendUpload(form, 'archivo', payload.archivo);
      return postMessage('/social/publicaciones', form);
    },
    deletePublication: (id: number) => deleteMessage(`/social/publicaciones/${id}`),
    like: (id: number) => put<{ liked: boolean; likes: number }>(`/social/publicaciones/${id}/like`),
    unlike: (id: number) => del<{ liked: boolean; likes: number }>(`/social/publicaciones/${id}/like`),
    comments: (id: number) => get<Comment[]>(`/social/publicaciones/${id}/comentarios`),
    addComment: (id: number, texto: string, parentId?: number) =>
      postMessage(`/social/publicaciones/${id}/comentarios`, { texto, parent_id: parentId }),
    deleteComment: (id: number) => deleteMessage(`/social/comentarios/${id}`),
    notifications: (page = 1) =>
      getPage<NotificationItem>('/social/notificaciones', { params: { page, per_page: 20 } }),
    readNotifications: () => patchMessage('/social/notificaciones/leer'),
  },
};

type PaymentFormFields = {
  secuencia: string;
  monto: number | string;
  fecha: string;
  folio?: string;
  concepto?: 'cuota' | 'mora';
  canal_pago?: 'pagalo' | 'ventanilla';
};

type TeacherSessionPayload = {
  carga_id: number;
  fecha: string;
  tema: string;
  semana?: string | null;
};

async function get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await client.get<ApiEnvelope<T>>(path, config);
  return response.data.data;
}

async function getPage<T>(path: string, config?: AxiosRequestConfig): Promise<PagedEnvelope<T>> {
  const response = await client.get<PagedEnvelope<T>>(path, config);
  return response.data;
}

async function post<T>(path: string, payload?: unknown): Promise<T> {
  const response = await client.post<ApiEnvelope<T>>(path, payload);
  return response.data.data;
}

async function put<T>(path: string, payload?: unknown): Promise<T> {
  const response = await client.put<ApiEnvelope<T>>(path, payload);
  return response.data.data;
}

async function patch<T>(path: string, payload?: unknown): Promise<T> {
  const response = await client.patch<ApiEnvelope<T>>(path, payload);
  return response.data.data;
}

async function del<T>(path: string): Promise<T> {
  const response = await client.delete<ApiEnvelope<T>>(path);
  return response.data.data;
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const response = await client.post<ApiEnvelope<T>>(path, form);
  return response.data.data;
}

async function postMessage(path: string, payload?: unknown): Promise<string> {
  const response = await client.post<{ message?: string }>(path, payload);
  return response.data.message ?? 'Operacion realizada correctamente.';
}

async function putMessage(path: string, payload?: unknown): Promise<string> {
  const response = await client.put<{ message?: string }>(path, payload);
  return response.data.message ?? 'Cambios guardados correctamente.';
}

async function patchMessage(path: string, payload?: unknown): Promise<string> {
  const response = await client.patch<{ message?: string }>(path, payload);
  return response.data.message ?? 'Cambios guardados correctamente.';
}

async function deleteMessage(path: string): Promise<string> {
  const response = await client.delete<{ message?: string }>(path);
  return response.data.message ?? 'Registro eliminado correctamente.';
}

function paymentForm(payload: PaymentFormFields) {
  const form = new FormData();
  form.append('secuencia', payload.secuencia);
  form.append('monto', String(payload.monto));
  form.append('fecha', payload.fecha);
  if (payload.folio) form.append('folio', payload.folio);
  if (payload.concepto) form.append('concepto', payload.concepto);
  if (payload.canal_pago) form.append('canal_pago', payload.canal_pago);
  return form;
}

async function appendUpload(form: FormData, field: string, file: UploadFile) {
  const mimeType = file.mimeType || inferMimeType(file.name);
  if (Platform.OS === 'web') {
    const blob = await fetch(file.uri).then((response) => response.blob());
    form.append(field, blob, file.name);
    return;
  }
  form.append(field, {
    uri: file.uri,
    name: file.name,
    type: mimeType,
  } as unknown as Blob);
}

function inferMimeType(name: string) {
  const extension = name.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    png: 'image/png',
    webp: 'image/webp',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
  };
  return types[extension ?? ''] ?? 'application/octet-stream';
}

function toApiError(error: AxiosError): ApiError {
  if (!error.response) {
    const timeout = error.code === 'ECONNABORTED';
    return new ApiError(timeout
      ? 'El servidor esta tardando demasiado. Intenta nuevamente.'
      : 'No pudimos conectar con CEPREUNA. Revisa tu internet e intenta nuevamente.');
  }

  const payload = error.response.data as {
    message?: string;
    error?: string;
    errors?: Record<string, string[]>;
  } | undefined;
  const validationMessage = payload?.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : undefined;
  const message = validationMessage
    || payload?.message
    || payload?.error
    || (error.response.status >= 500
      ? 'El servidor no pudo completar la operacion.'
      : 'No se pudo completar la solicitud.');
  return new ApiError(message, error.response.status, payload?.errors);
}

export async function getAccessToken() {
  if (memoryToken) return memoryToken;
  if (Platform.OS === 'web') {
    memoryToken = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
  } else {
    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  }
  return memoryToken;
}

export async function setAccessToken(token: string) {
  memoryToken = token;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
}

export async function clearAccessToken() {
  memoryToken = null;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

export function subscribeUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function absoluteApiUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('/')) {
    return `${new URL(API_BASE_URL).origin}${pathOrUrl}`;
  }
  return `${API_BASE_URL}/${pathOrUrl.replace(/^\/+/, '')}`;
}

export async function authorizedHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isTrustedApiUrl(pathOrUrl: string) {
  try {
    const target = new URL(absoluteApiUrl(pathOrUrl));
    const base = new URL(API_BASE_URL);
    return target.protocol === 'https:' && target.host === base.host;
  } catch {
    return false;
  }
}
