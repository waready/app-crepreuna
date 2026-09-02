export type UserRole = 'estudiante' | 'docente';

export type Period = {
  id: number;
  codigo?: string | null;
  nombre?: string | null;
  inicio_ciclo?: string | null;
  fin_ciclo?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: string | null;
};

export type EnrollmentProfile = {
  id: number;
  codigo?: string | null;
  modalidad?: string | null;
  tipo_estudiante?: string | null;
  sede?: string | null;
  area?: string | null;
  turno?: string | null;
};

export type UserProfile = {
  id: number;
  nombres?: string | null;
  paterno?: string | null;
  materno?: string | null;
  nombre_completo: string;
  nro_documento?: string | null;
  usuario?: string | null;
  email?: string | null;
  celular?: string | null;
  direccion?: string | null;
  fecha_nac?: string | null;
  sexo?: string | null;
  anio_egreso?: number | null;
  tipo_documento?: string | null;
  colegio?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  condicion?: string | null;
  profesion?: string | null;
  grado_academico?: string | null;
  programa?: string | null;
  codigo_unap?: string | null;
  edit?: string | number | boolean | null;
  panel?: string | number | boolean | null;
  rol: UserRole;
  foto_url?: string | null;
  inscripcion?: EnrollmentProfile | null;
};

export type SessionData = {
  access_token: string;
  token_type: 'Bearer' | string;
  expires_at: string;
  usuario: UserProfile;
  periodo: Period;
};

export type DashboardData = {
  usuario: UserProfile;
  periodo: Period;
  resumen: {
    cursos: number;
    notificaciones_sin_leer: number;
  };
};

export type Contact = {
  nombre: string;
  telefono?: string | null;
};

export type GroupContacts = {
  auxiliar?: Contact | null;
  coordinador?: Contact | null;
};

export type ScheduleClass = {
  id: number;
  dia: number;
  plantilla_horarios_id?: number;
  carga_id: number;
  curso_id: number;
  curso: string;
  color?: string | null;
  docente?: string | null;
  grupo?: string | null;
  grupo_aulas_id?: number;
  turno?: string | null;
  turno_id?: number;
  tipo?: string | null;
  hora_inicio?: string;
  hora_fin?: string;
};

export type ScheduleBlock = {
  plantilla_id: number;
  hora_inicio: string;
  hora_fin: string;
  tipo?: string | null;
  clase?: ScheduleClass | null;
};

export type ScheduleDay = {
  id: number;
  nombre: string;
  bloques: ScheduleBlock[];
};

export type StudentSchedule = {
  matricula: null | {
    id: number;
    grupo_aula_id: number;
    grupo?: string | null;
    area?: string | null;
    turno?: string | null;
  };
  dias?: ScheduleDay[];
  horarios: ScheduleClass[];
  contactos?: GroupContacts | null;
};

export type TeacherSchedule = {
  horarios: ScheduleClass[];
  contactos: Array<{
    grupo_aula_id: number;
    grupo?: string | null;
    auxiliar?: Contact | null;
    coordinador?: Contact | null;
  }>;
};

export type AttendanceItem = {
  id: number;
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  estado: string;
  estado_label: string;
  observacion?: string | null;
  curso?: string | null;
  grupo?: string | null;
  tema?: string | null;
  carga_id?: number;
  tipo?: string | null;
  cantidad_horas?: number | string | null;
  horas_pago?: number | string | null;
  cantidad_estudiantes?: number | null;
};

export type StudentAttendance = {
  rango?: { inicio?: string | null; fin?: string | null } | null;
  asistencias: AttendanceItem[];
};

export type StudentCourse = {
  id: number;
  curso_id: number;
  curso: string;
  color?: string | null;
  grupo?: string | null;
  docente?: string | null;
  tipo?: string | null;
  meet_url?: string | null;
  encuesta_habilitada: boolean;
  encuesta_realizada: boolean;
};

export type TeacherCourse = {
  id: number;
  curso_id: number;
  grupo_aula_id: number;
  curso: string;
  grupo?: string | null;
  color?: string | null;
  meet_url?: string | null;
  tipo?: string | null;
  estado?: string | null;
  aula?: string | null;
  local?: string | null;
  direccion?: string | null;
  sede?: string | null;
  modalidad: 'Virtual' | 'Presencial' | string;
  auxiliar?: Contact | null;
  coordinador?: Contact | null;
};

export type CourseCriterion = {
  id: number;
  denominacion: string;
  puntaje?: number | string | null;
};

export type TeacherStudent = {
  id: number;
  nro_documento?: string | null;
  usuario?: string | null;
  nombre_completo: string;
};

export type AcademicMaterial = {
  id: number;
  curso_id: number;
  curso: string;
  color?: string | null;
  semana?: number | string | null;
  tipo?: string | null;
  archivo_url: string;
};

export type PaymentScheduleItem = {
  id: number;
  nro_cuota: number;
  inicio?: string | null;
  fin?: string | null;
  observacion?: string | null;
};

export type TariffItem = {
  id: number;
  nro_cuota: number;
  monto: number | string;
  pagado?: number | string | null;
  mora?: number | string | null;
  modalidad?: string | null;
  tipo_estudiante?: string | null;
};

export type PaymentItem = {
  id: number;
  secuencia: string;
  monto_banco: number | string;
  monto_aplicado: number | string;
  fecha: string;
  folio?: string | null;
  canal_pago?: string | null;
  concepto?: string | null;
  concepto_pagos_id?: number | null;
  voucher_url?: string | null;
};

export type PaymentsData = {
  inscripcion: EnrollmentProfile | null;
  cronograma: PaymentScheduleItem[];
  tarifario: TariffItem[];
  pagos: PaymentItem[];
  resumen: { pagado: number; total?: number; deuda: number };
};

export type PaymentValidation = {
  valido: boolean;
  secuencia: string;
  fecha: string;
  monto: number;
  monto_aplicable: number;
  canal?: string | null;
};

export type VocationalQuestion = {
  id: number;
  denominacion: string;
  tipo?: string | null;
  area?: string | null;
};

export type VocationalResult = {
  id: number;
  puntajes: { ingenieria: number; biomedicas: number; sociales: number };
  area_sugerida: string;
  fecha?: string | null;
};

export type VocationalTest = {
  estado: 'proximamente' | 'activo' | 'cerrado' | string;
  respondido: boolean;
  preguntas: VocationalQuestion[];
  resultado?: VocationalResult | null;
  constancia_url?: string | null;
};

export type TeacherSession = {
  id: number;
  fecha: string;
  semana?: string | null;
  tema: string;
  estado?: string | null;
  carga_id: number;
  curso: string;
  grupo?: string | null;
  modalidad?: string | null;
};

export type QuestionCourse = {
  id: number;
  curso: string;
  grupos: string[];
  modalidades: string[];
};

export type QuestionBatch = {
  id: number;
  curso_id: number;
  curso: string;
  semana: number;
  nivel: 'basico' | 'intermedio' | 'avanzado' | string;
  version: number;
  archivo_nombre: string;
  estado: string;
  comentario?: string | null;
  archivo_url: string;
  revision_url?: string | null;
  created_at?: string | null;
};

export type SocialAuthor = {
  id: number;
  rol: string;
  nombre: string;
  foto_url?: string | null;
};

export type Publication = {
  id: number;
  tipo: string;
  descripcion: string;
  user_id: number;
  role_id: number;
  like: number;
  liked: boolean;
  comments_count: number;
  propia: boolean;
  imagen_url?: string | null;
  archivo_url?: string | null;
  created_at: string;
  autor: SocialAuthor;
};

export type Comment = {
  id: number;
  descripcion: string;
  tipo: string;
  user_id: number;
  role_id: number;
  parent_id?: number | null;
  created_at: string;
  autor: SocialAuthor;
};

export type NotificationItem = {
  id: number;
  tipo?: string | null;
  estado: string;
  descripcion: string;
  publicacion_id?: number | null;
  comentario_id?: number | null;
  created_at?: string | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page?: number;
  total: number;
  unread?: number;
};

export type UploadFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};
