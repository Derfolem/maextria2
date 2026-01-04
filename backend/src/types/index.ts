export type UserRole = 'student' | 'teacher' | 'admin';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  document?: string;
  address?: string;
  payment_info?: string;
  email_verified: number;
  verification_token?: string;
  reset_token?: string;
  reset_token_expiry?: number;
  created_at: number;
  updated_at: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  teacher_id: string;
  cover_image?: string;
  duration_hours?: number;
  difficulty?: Difficulty;
  certificate_price: number;
  is_published: number;
  rating: number;
  total_students: number;
  created_at: number;
  updated_at: number;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  created_at: number;
}

export interface LessonMaterial {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: number;
}

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  progress: number;
  completed: number;
  enrolled_at: number;
  completed_at?: number;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  completed: number;
  completed_at?: number;
}

export interface Certificate {
  id: string;
  enrollment_id: string;
  student_id: string;
  course_id: string;
  teacher_id: string;
  price: number;
  teacher_share: number;
  admin_share: number;
  payment_status: PaymentStatus;
  payment_date?: number;
  issued_at: number;
}

export interface SystemSettings {
  key: string;
  value: string;
  updated_at: number;
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id?: string;
  course_id?: string;
  metadata?: string;
  created_at: number;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface DashboardStats {
  totalRevenue: number;
  totalStudents: number;
  totalCourses: number;
  totalCertificates: number;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topCourses: Array<{
    courseId: string;
    title: string;
    students: number;
    revenue: number;
  }>;
  avgCompletionRate: number;
}
