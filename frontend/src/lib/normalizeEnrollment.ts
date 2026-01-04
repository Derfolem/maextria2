import { Enrollment } from '../types';
import { normalizeCourse } from './normalizeCourse';

type RawEnrollment = Record<string, any>;

export function normalizeEnrollment(raw: RawEnrollment): Enrollment {
  const course = normalizeCourse({
    id: raw.course_id,
    title: raw.course_title ?? raw.title,
    description: raw.course_description ?? '',
    certificate_price: raw.certificate_price,
    cover_image: raw.cover_image,
    difficulty: raw.difficulty,
    teacher_name: raw.teacher_name,
    is_published: 1,
    created_at: raw.enrolled_at,
    updated_at: raw.enrolled_at,
  });

  return {
    id: raw.id,
    user_id: raw.student_id ?? raw.user_id,
    course_id: raw.course_id,
    enrolled_at: raw.enrolled_at,
    progress: raw.progress ?? 0,
    completed: Boolean(raw.completed),
    course,
  };
}
