export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

export interface Course {
  id: string | number;
  title: string;
  description: string;
  price: number;
  teacher_id: string | number;
  teacher_name?: string;
  category?: string;
  level?: string;
  thumbnail?: string;
  duration_hours?: number;
  is_published: boolean;
  created_at: string | number;
  updated_at: string | number;
  enrollment_count?: number;
  modules?: Module[];
}

export interface Module {
  id: string | number;
  course_id: string | number;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string | number;
  module_id: string | number;
  title: string;
  content?: string;
  video_url?: string;
  order_index: number;
  duration?: number;
  materials?: Material[];
}

export interface Material {
  id: string | number;
  lesson_id: string | number;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
}

export interface Enrollment {
  id: string | number;
  user_id: string | number;
  course_id: string | number;
  enrolled_at: string;
  progress: number;
  completed: boolean;
  course?: Course;
}

export interface Progress {
  id: string | number;
  user_id: string | number;
  lesson_id: string | number;
  completed: boolean;
  completed_at?: string;
}

export interface Certificate {
  id: string | number;
  user_id: string | number;
  course_id: string | number;
  issued_at: string;
  certificate_url: string;
  course?: Course;
}

export interface DashboardStats {
  total_courses?: number;
  active_students?: number;
  total_revenue?: number;
  total_enrollments?: number;
  completed_courses?: number;
  in_progress_courses?: number;
  certificates?: number;
  total_users?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SystemSettings {
  profit_share_percentage: number;
}
