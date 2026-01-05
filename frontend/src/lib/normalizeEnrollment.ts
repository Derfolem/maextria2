import { Enrollment } from '../types';
import { normalizeCourse } from './normalizeCourse';

type RawEnrollment = Record<string, any>;

export function normalizeEnrollment(raw: RawEnrollment): Enrollment {
  const rawCourse = raw.course ?? raw.cursos ?? raw.curso;
  const course = normalizeCourse({
    ...(rawCourse || {}),
    id: raw.course_id ?? raw.curso_id ?? rawCourse?.id,
    title: raw.course_title ?? rawCourse?.titulo ?? rawCourse?.title ?? raw.title,
    description: raw.course_description ?? rawCourse?.descricao ?? '',
    certificate_price: raw.certificate_price ?? rawCourse?.preco_certificado,
    cover_image: raw.cover_image ?? rawCourse?.imagem_capa_url,
    difficulty: raw.difficulty ?? rawCourse?.nivel,
    teacher_name: raw.teacher_name ?? rawCourse?.teacher_name,
    is_published: rawCourse?.ativo ?? 1,
    created_at: raw.enrolled_at ?? raw.data_matricula,
    updated_at: raw.enrolled_at ?? raw.data_matricula,
  });

  return {
    id: raw.id,
    user_id: raw.student_id ?? raw.user_id ?? raw.usuario_id,
    course_id: raw.course_id ?? raw.curso_id,
    enrolled_at: raw.enrolled_at ?? raw.data_matricula,
    progress: raw.progress ?? 0,
    completed: Boolean(raw.completed),
    course,
  };
}
