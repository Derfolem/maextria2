export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  is_admin?: boolean; // Added for local auth handling
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
  rating?: number;
  modules?: Module[];
  em_curadoria?: boolean;
  feedback_curadoria?: string;
  curso_original_id?: string | null;
  versao?: number;
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
  image_urls?: string[];
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
  rating?: number;
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
  courses?: { id: string; title: string }[];
}

export interface SystemSettings {
  profit_share_percentage: number;
}

export interface Trilha {
  id: string;
  nome: string;
  professor_id: string;
  professor_nome?: string;
  ativa: boolean;
  criado_em: string;
  atualizado_em: string;
  cursos?: TrilhaCurso[];
}

export interface TrilhaCurso {
  id: string;
  trilha_id: string;
  curso_id: string;
  ordem: number;
  criado_em?: string;
  curso?: Course;
}

export interface MatriculaTrilha {
  id: string;
  usuario_id: string;
  trilha_id: string;
  data_matricula: string;
  trilha?: Trilha;
  progresso?: number;
}
