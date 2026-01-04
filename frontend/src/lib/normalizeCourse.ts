import { Course } from '../types';

type RawCourse = Record<string, any>;

export function normalizeCourse(raw: RawCourse): Course {
  return {
    id: raw.id,
    title: raw.title ?? '',
    description: raw.description ?? '',
    price: Number(raw.certificate_price ?? raw.price ?? 0),
    teacher_id: raw.teacher_id,
    teacher_name: raw.teacher_name ?? raw.teacher?.name,
    category:
      raw.category_name ??
      raw.category?.name ??
      (typeof raw.category === 'string' ? raw.category : undefined),
    level: raw.difficulty ?? raw.level,
    thumbnail: raw.cover_image ?? raw.thumbnail,
    duration_hours: raw.duration_hours ?? raw.duration ?? raw.durationHours,
    is_published:
      typeof raw.is_published === 'number'
        ? raw.is_published === 1
        : Boolean(raw.is_published),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    enrollment_count: Number(
      raw.student_count ?? raw.enrollment_count ?? raw.total_students ?? 0
    ),
    modules: raw.modules,
  };
}
