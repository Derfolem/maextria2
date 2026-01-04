import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { useAuthStore } from '../lib/store';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { FaBook, FaCheckCircle, FaUser } from 'react-icons/fa';
import { normalizeCourse } from '../lib/normalizeCourse';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    loadCourse();
    if (isAuthenticated && user?.role === 'student') {
      checkEnrollment();
    }
  }, [id, isAuthenticated]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/public/${id}`);
      setCourse(normalizeCourse(response.data));
    } catch (error) {
      toast.error('Erro ao carregar curso');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const response = await api.get('/enrollments/my');
      const enrolled = response.data.some((e: any) => String(e.course_id) === String(id));
      setIsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para se inscrever');
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await api.post('/enrollments', { course_id: id });
      toast.success('Inscrição realizada com sucesso!');
      setIsEnrolled(true);
      navigate('/student/my-courses');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao se inscrever');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-lg">Curso não encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10">
        <div>
          <div className="w-full h-96 rounded-[28px] mb-8 overflow-hidden bg-[hsl(var(--foreground))] text-white flex items-center justify-center text-6xl font-bold">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))]">
                {course.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
              <span className="uppercase tracking-[0.2em]">{course.category || 'Trilha'}</span>
              <span>{course.enrollment_count || 0} alunos</span>
            </div>
            <h1 className="headline-font text-4xl md:text-5xl">{course.title}</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-lg">{course.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2">
                <FaUser className="text-[hsl(var(--primary))]" />
                <span>{course.teacher_name || 'Professor MAEXTRIA'}</span>
              </div>
              {course.category && (
                <div className="flex items-center gap-2">
                  <FaBook className="text-[hsl(var(--primary))]" />
                  <span>{course.category}</span>
                </div>
              )}
            </div>
          </div>

          {course.modules && course.modules.length > 0 && (
            <div className="mt-10">
              <h2 className="headline-font text-3xl mb-6">Conteúdo do Curso</h2>
              <div className="space-y-5">
                {course.modules.map((module) => (
                  <div key={module.id} className="card">
                    <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                    {module.description && (
                      <p className="text-[hsl(var(--muted-foreground))] mb-3">{module.description}</p>
                    )}
                    {module.lessons && module.lessons.length > 0 && (
                      <div className="ml-4 mt-2 space-y-2">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
                            <FaCheckCircle className="text-[hsl(var(--accent))]" />
                            <span>{lesson.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card sticky top-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Investimento</p>
              <div className="text-3xl font-bold text-[hsl(var(--primary))] mt-2">
                {course.price === 0 ? 'Sem custo' : `R$ ${course.price.toFixed(2)}`}
              </div>
            </div>

            {isEnrolled ? (
              <button
                onClick={() => navigate('/student/my-courses')}
                className="w-full btn-accent py-3"
              >
                Acessar Meus Cursos
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full btn-accent py-3"
              >
                {enrolling ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            )}

            <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
              {[
                'Acesso vitalicio',
                'Certificado de conclusao',
                'Suporte via chat inteligente',
                'Conteúdo atualizado',
              ].map((text) => (
                <div key={text} className="flex items-center gap-2">
                  <FaCheckCircle className="text-[hsl(var(--primary))]" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
