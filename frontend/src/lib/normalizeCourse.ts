import { Course } from '../types';

type RawCourse = Record<string, any>;

export function normalizeCourse(raw: RawCourse): Course {
    console.log('DEBUG normalize:', { raw_carga: raw.carga_horaria_horas, raw_duration: raw.duration_hours, result: raw.duration_hours ?? raw.carga_horaria_horas });
  return {
    id: raw.id,
    title: raw.title ?? raw.titulo ?? '',
    description: raw.description ?? raw.descricao ?? '',
    price: Number(raw.certificate_price ?? raw.preco_certificado ?? raw.price ?? 0),
    teacher_id: raw.teacher_id,
    teacher_name: raw.teacher_name ?? raw.professor_nome ?? raw.teacher?.name ?? raw.professor?.nome_completo,
    category:
      raw.category_name ??
      raw.category?.name ??
      raw.categoria ??
      (typeof raw.category === 'string' ? raw.category : undefined),
    level: raw.difficulty ?? raw.level,
    thumbnail: raw.cover_image ?? raw.imagem_capa_url ?? raw.thumbnail,
    duration_hours: raw.duration_hours ?? raw.carga_horaria_horas ?? raw.duration ?? raw.durationHours,
    is_published:
      typeof raw.is_published === 'number'
        ? raw.is_published === 1
        : raw.ativo !== undefined
          ? Boolean(raw.ativo)
          : Boolean(raw.is_published),
    created_at: raw.created_at ?? raw.criado_em,
    updated_at: raw.updated_at ?? raw.atualizado_em ?? raw.criado_em,
    enrollment_count: Number(
      raw.student_count ?? raw.enrollment_count ?? raw.total_students ?? 0
    ),
    rating: raw.rating_medio ?? raw.rating ?? 4.3,
    modules: raw.modules,
  };
}
