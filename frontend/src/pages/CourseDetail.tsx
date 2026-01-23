import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course } from '../types';
import { useAuthStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { FaBook, FaCheckCircle, FaUser } from 'react-icons/fa';
import { normalizeCourse } from '../lib/normalizeCourse';
import { SEO, createCourseSchema, createBreadcrumbSchema } from '../components/SEO';
import { trackCourseView, trackEnrollment } from '../lib/analytics';
import { Breadcrumb } from '../components/Breadcrumb';

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
      const { data: courseData, error: courseError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', id)
        .single();
      if (courseError) {
        throw courseError;
      }

      const { data: modulesData, error: modulesError } = await supabase
        .from('modulos')
        .select('*, aulas(*)')
        .eq('curso_id', id)
        .order('ordem', { ascending: true });
      if (modulesError) {
        throw modulesError;
      }

      const mappedModules = (modulesData || []).map((module: any) => ({
        id: module.id,
        title: module.titulo_modulo,
        description: module.conteudo_texto_html,
        order_index: module.ordem,
        lessons: (module.aulas || [])
          .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
          .map((lesson: any) => ({
            id: lesson.id,
            module_id: module.id,
            title: lesson.titulo,
            content: lesson.conteudo_html,
            video_url: lesson.video_url,
            order_index: lesson.ordem,
          })),
      }));

      const normalized = normalizeCourse({
        ...courseData,
        modules: mappedModules,
      });

      setCourse(normalized);

      // Rastrear visualização do curso no Google Analytics
      trackCourseView(String(normalized.id), normalized.title, normalized.category);
    } catch (error) {
      toast.error('Erro ao carregar curso');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('matriculas')
        .select('id')
        .eq('curso_id', id)
        .eq('usuario_id', user.id);
      if (error) {
        throw error;
      }
      setIsEnrolled(Boolean(data && data.length > 0));
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
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }
      const { error } = await supabase.from('matriculas').insert({
        usuario_id: user.id,
        curso_id: id,
      });
      if (error) {
        throw error;
      }
      toast.success('Inscrição realizada com sucesso!');
      setIsEnrolled(true);

      // Rastrear matrícula como conversão no Google Analytics
      if (course) {
        trackEnrollment(String(course.id), course.title, course.price || 0);
      }

      navigate('/student/my-courses');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao se inscrever');
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

  // Preparar dados para SEO
  const courseUrl = `https://www.maextria.com.br/course/${course.id}`;
  const courseImage = course.thumbnail || 'https://www.maextria.com.br/maextria-logo.png';
  const courseDescription = course.description || `Aprenda ${course.title} com certificado reconhecido. Acesso vitalício e suporte especializado.`;

  // Schema.org para o curso
  const courseSchema = createCourseSchema({
    name: course.title,
    description: courseDescription,
    url: courseUrl,
    image: courseImage,
    price: course.price || 0,
    instructor: 'MAEXTRIA',
    duration: `${course.duration_hours || 0}h`,
    level: course.level || 'Iniciante',
  });

  // Breadcrumb para navegação
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', url: 'https://www.maextria.com.br/' },
    { name: 'Cursos', url: 'https://www.maextria.com.br/courses' },
    { name: course.title, url: courseUrl },
  ]);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [courseSchema, breadcrumbSchema],
  };

  return (
    <>
      <SEO
        title={`${course.title} - Curso Online com Certificado | MAEXTRIA`}
        description={courseDescription}
        url={courseUrl}
        image={courseImage}
        type="course"
        schema={schema}
        keywords={[
          'curso online',
          'certificado reconhecido',
          course.category || 'educação',
          course.title,
          'MAEXTRIA'
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Breadcrumb visual */}
      <Breadcrumb
        items={[
          { label: 'Cursos', href: '/courses' },
          { label: course.title },
        ]}
        className="mb-6"
      />

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-10">
        <div>
          <div className="w-full aspect-[2/3] rounded-[28px] mb-8 overflow-hidden bg-[hsl(var(--foreground))] text-white flex items-center justify-center text-6xl font-bold">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                loading="lazy"
                decoding="async"
                width={1280}
                height={720}
                className="w-full h-full object-cover"
              />
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
                {enrolling ? 'Inscrevendo...' : 'Matricule-se grátis'}
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
    </>
  );
}
