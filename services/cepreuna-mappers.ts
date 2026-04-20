import { findArray, pickNumber, pickString } from './normalizers';

const DOCS_BASE_URL = 'https://sistemas.cepreuna.edu.pe/storage/documentos/';
const PUBLICATIONS_BASE_URL = 'https://app.cepreuna.edu.pe/storage/publicaciones/';

export function normalizeRepoPosts(data: unknown) {
  return findArray(data, ['data', 'publicaciones', 'items']).map((item, index) => {
    const userData = item.datos_usuario && typeof item.datos_usuario === 'object'
      ? (item.datos_usuario as Record<string, unknown>)
      : {};
    const rol = item.rol && typeof item.rol === 'object' ? (item.rol as Record<string, unknown>) : {};
    const image = pickString(item, ['imagen_pub'], '');
    const thumb = pickString(userData, ['path_foto'], '') || pickString(item, ['imagen_tumb'], '');

    return {
      id: pickString(item, ['id', 'publicacion_id'], `${index}`),
      name: pickString(userData, ['nombres', 'nombre'], pickString(item, ['usuario', 'nombre'], `Usuario ${pickString(item, ['user_id'], '')}`)),
      role: pickString(rol, ['name'], pickString(item, ['rol', 'role'], 'Estudiante')),
      time: pickString(item, ['created_at', 'fecha'], 'Reciente'),
      text: pickString(item, ['descripcion', 'texto', 'contenido'], 'Publicacion institucional'),
      likes: pickNumber(item, ['like', 'likes', 'reacciones'], 0),
      comments: pickNumber(item, ['comentarios', 'comments'], 0),
      avatar: thumb ? toPublicationUrl(thumb) : '',
      image: image ? toPublicationUrl(image) : '',
      accent: ['#006CAF', '#0F7A59', '#BF211E', '#7A4E00'][index % 4],
    };
  });
}

export function normalizeRepoBookletCategories(data: unknown) {
  const categories = findArray(data, ['cuadernillos', 'data', 'items']);
  const categoryMap = new Map<string, { denominacion: string; color: string; semanas: Map<string, { semana: string; cuadernillos: { id: string; nombre: string; descripcion: string; archivoUrl: string; fecha: string }[] }> }>();

  categories.forEach((category) => {
    const color = pickString(category, ['color'], '#006CAF');
    const denominacion = pickString(category, ['denominacion', 'curso', 'nombre'], 'General');
    const basePath = pickString(category, ['base_path'], '');
    const categoryKey = pickString(category, ['id'], denominacion);
    const currentCategory = categoryMap.get(categoryKey) ?? { denominacion, color, semanas: new Map() };

    findArray(category.cuadernillos, ['cuadernillos']).forEach((booklet, index) => {
      const semana = pickString(booklet, ['semana', 'week'], `${index + 1}`);
      const path = pickString(booklet, ['path', 'url', 'archivo'], '');
      const bookletId = pickString(booklet, ['id'], `${categoryKey}-${semana}-${path || index}`);
      const row = {
        id: bookletId,
        nombre: pickString(booklet, ['nombre', 'titulo'], `${denominacion} - Semana ${semana}`),
        descripcion: pickString(booklet, ['descripcion'], ''),
        archivoUrl: toDocumentUrl(path, basePath),
        fecha: pickString(booklet, ['created_at', 'fecha'], ''),
      };

      const currentWeek = currentCategory.semanas.get(semana) ?? { semana, cuadernillos: [] };
      if (!currentWeek.cuadernillos.some((item) => item.id === row.id || item.archivoUrl === row.archivoUrl)) {
        currentWeek.cuadernillos.push(row);
      }
      currentCategory.semanas.set(semana, currentWeek);
    });

    categoryMap.set(categoryKey, currentCategory);
  });

  return Array.from(categoryMap.values())
    .map((category) => ({
      denominacion: category.denominacion,
      color: category.color,
      semanas: Array.from(category.semanas.values()).sort((a, b) => Number(b.semana) - Number(a.semana)),
    }))
    .filter((category) => category.semanas.length)
    .sort((a, b) => a.denominacion.localeCompare(b.denominacion));
}

export function normalizeRepoTemarios(data: unknown) {
  const rows = findArray(data, ['temarios', 'data', 'items']);
  const seen = new Set<string>();

  return rows
    .map((item, index) => {
      const temario = item.temarios && typeof item.temarios === 'object' ? (item.temarios as Record<string, unknown>) : item;
      const path = pickString(temario, ['path', 'url', 'archivo'], '');
      const id = pickString(item, ['id'], `${index}`);
      const key = `${id}-${path}`;
      const row = {
        id: pickString(temario, ['id'], id),
        courseId: id,
        area: pickString(item, ['area'], 'Area academica'),
        course: pickString(item, ['curso', 'denominacion', 'nombre'], 'Curso CEPREUNA'),
        color: pickString(item, ['color'], '#006CAF'),
        archivoUrl: toDocumentUrl(path, pickString(item, ['base_path'], '')),
      };
      if (seen.has(key)) {
        return null;
      }
      seen.add(key);
      return row;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}


export function normalizeRepoSchedule(data: unknown) {
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  const schedule = findArray(root.horario, ['horario']);
  const dayNames: Record<string, string> = {
    '1': 'Lunes',
    '2': 'Martes',
    '3': 'Miercoles',
    '4': 'Jueves',
    '5': 'Viernes',
    '6': 'Sabado',
    '7': 'Domingo',
    Lu: 'Lunes',
    Ma: 'Martes',
    Mi: 'Miercoles',
    Ju: 'Jueves',
    Vi: 'Viernes',
    Sa: 'Sabado',
    Do: 'Domingo',
  };

  const grouped = new Map<string, { time: string; course: string; teacher: string; color: string; link: string }[]>();

  schedule.forEach((turno) => {
    findArray(turno.dias, ['dias']).forEach((dia) => {
      const day = dayNames[pickString(dia, ['dia'], '')] ?? pickString(dia, ['dia'], 'Dia');
      findArray(dia.disponibilidad, ['disponibilidad'])
        .filter((block) => pickString(block, ['tipo']) === '1' && block.horario)
        .forEach((block) => {
          const horario = block.horario && typeof block.horario === 'object' ? (block.horario as Record<string, unknown>) : {};
          const curso = horario.curso && typeof horario.curso === 'object' ? (horario.curso as Record<string, unknown>) : {};
          const carga = horario.carga && typeof horario.carga === 'object' ? (horario.carga as Record<string, unknown>) : {};
          const docente = carga.docente && typeof carga.docente === 'object' ? (carga.docente as Record<string, unknown>) : {};
          const teacherName = [
            pickString(docente, ['nombres'], ''),
            pickString(docente, ['paterno'], ''),
            pickString(docente, ['materno'], ''),
          ].filter(Boolean).join(' ');
          const row = {
            time: `${pickString(block, ['hora_inicio'], '')} - ${pickString(block, ['hora_fin'], '')}`,
            course: pickString(curso, ['denominacion', 'nombre'], 'Curso CEPREUNA'),
            teacher: pickString(horario, ['docente'], teacherName || 'Docente asignado'),
            color: pickString(curso, ['color'], '#006CAF'),
            link: pickString(carga, ['link'], ''),
          };
          grouped.set(day, [...(grouped.get(day) ?? []), row]);
        });
    });
  });

  return Array.from(grouped.entries()).map(([day, blocks]) => ({ day, blocks }));
}

function toPublicationUrl(path: string) {
  if (!path || path.startsWith('http')) {
    return path;
  }
  return `${PUBLICATIONS_BASE_URL}${path.replace(/^\/+/, '')}`;
}

function toDocumentUrl(path: string, basePath = '') {
  if (!path) {
    return '';
  }
  if (path.startsWith('http')) {
    return path.replace('https://sistemas.cepreuna.edu.pe/storage/documentos/', DOCS_BASE_URL);
  }
  const cleanPath = path.replace(/^\/?storage\/documentos\/?/, '').replace(/^\/+/, '');
  const cleanBase = basePath ? `${basePath.replace(/\/+$/, '')}/storage/documentos/` : DOCS_BASE_URL;
  return `${cleanBase}${cleanPath}`;
}
