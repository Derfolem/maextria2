import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Enrollment } from '../../types';
import { supabase } from '../../lib/supabase';
import { FaPlay, FaCertificate } from 'react-icons/fa';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';
import { useAuthStore } from '../../lib/store';

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    loadEnrollments();
  }, [user?.id]);

  const loadEnrollments = async () => {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('matriculas')
        .select('*, cursos(*)')
        .order('data_matricula', { ascending: false });
      if (error) {
        throw error;
      }
      const normalized = (data || []).filter((row: any) => row.cursos).map(normalizeEnrollment);
      const courseIds = normalized.map((item) => item.course_id);

      if (courseIds.length === 0) {
        setEnrollments(normalized);
        return;
      }

      const [
        modulesRes,
        progressRes,
        quizzesRes,
        responsesRes,
        certsRes,
      ] = await Promise.all([
        supabase
          .from('modulos')
          .select('id, curso_id, aulas(id)')
          .in('curso_id', courseIds),
        supabase
          .from('progresso_aula')
          .select('concluido, aulas!inner(modulos!inner(curso_id))')
          .eq('usuario_id', user.id),
        supabase
          .from('questionarios')
          .select('id, curso_id')
          .in('curso_id', courseIds),
        supabase
          .from('respostas_questionario')
          .select('questionario_id, aprovado')
          .eq('usuario_id', user.id),
        supabase
          .from('certificados')
          .select('id, curso_id, link_pdf')
          .eq('usuario_id', user.id),
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (progressRes.error) throw progressRes.error;
      if (quizzesRes.error) throw quizzesRes.error;
      if (responsesRes.error) throw responsesRes.error;
      if (certsRes.error) throw certsRes.error;

      const lessonsByCourse = (modulesRes.data || []).reduce((acc: Record<string, number>, mod: any) => {
        const count = mod.aulas?.length || 0;
        acc[String(mod.curso_id)] = (acc[String(mod.curso_id)] || 0) + count;
        return acc;
      }, {});

      const completedLessonsByCourse = (progressRes.data || []).reduce((acc: Record<string, number>, item: any) => {
        if (!item.concluido) return acc;
        const courseId = item.aulas?.modulos?.curso_id;
        if (!courseId) return acc;
        acc[String(courseId)] = (acc[String(courseId)] || 0) + 1;
        return acc;
      }, {});

      const quizIdToCourse: Record<string, string> = {};
      const quizzesByCourse = (quizzesRes.data || []).reduce((acc: Record<string, number>, quiz: any) => {
        const key = String(quiz.curso_id);
        acc[key] = (acc[key] || 0) + 1;
        quizIdToCourse[String(quiz.id)] = key;
        return acc;
      }, {});

      const completedQuizzesByCourse = (responsesRes.data || []).reduce((acc: Record<string, number>, response: any) => {
        if (!response.aprovado) return acc;
        const courseId = quizIdToCourse[String(response.questionario_id)];
        if (!courseId) return acc;
        acc[courseId] = (acc[courseId] || 0) + 1;
        return acc;
      }, {});

      const certsByCourse = (certsRes.data || []).reduce((acc: Record<string, any>, cert: any) => {
        acc[String(cert.curso_id)] = cert;
        return acc;
      }, {});

      const withProgress = normalized.map((enrollment) => {
        const courseId = String(enrollment.course_id);
        const totalLessons = lessonsByCourse[courseId] || 0;
        const completedLessons = completedLessonsByCourse[courseId] || 0;
        const totalQuizzes = quizzesByCourse[courseId] || 0;
        const completedQuizzes = completedQuizzesByCourse[courseId] || 0;
        const totalItems = totalLessons + totalQuizzes;
        const completedItems = completedLessons + completedQuizzes;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        const completed = totalLessons > 0 && completedLessons === totalLessons && completedQuizzes === totalQuizzes;
        const certificate = certsByCourse[courseId];

        return {
          ...enrollment,
          progress,
          completed,
          certificate,
        } as Enrollment & { certificate?: { id: string; link_pdf?: string } };
      });

      setEnrollments(withProgress);
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (filter === 'in-progress') return !enrollment.completed;
    if (filter === 'completed') return enrollment.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Meus cursos</p>
          <h1 className="headline-font text-4xl md:text-5xl">Sua trilha ativa</h1>
        </div>
        <Link to="/courses" className="btn-accent">
          Explorar cursos
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-accent' : 'btn-outline'}
        >
          Todos ({enrollments.length})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={filter === 'in-progress' ? 'btn-accent' : 'btn-outline'}
        >
          Em andamento ({enrollments.filter((e) => !e.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-accent' : 'btn-outline'}
        >
          Concluidos ({enrollments.filter((e) => e.completed).length})
        </button>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            Voce nao possui cursos ativos no momento.
          </p>
          <Link to="/courses" className="btn-accent">
            Ir para a vitrine de cursos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-grow mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold mb-2">
                    {enrollment.course?.title}
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))] mb-3">
                    {enrollment.course?.description}
                  </p>
                  <div className="w-full bg-[hsl(var(--muted))] rounded-full h-3">
                    <div
                      className="bg-[hsl(var(--primary))] h-3 rounded-full transition-all"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                    Progresso: {enrollment.progress}%
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to={`/student/course/${enrollment.course_id}`}
                    className="btn-accent flex items-center space-x-2"
                  >
                    <FaPlay />
                    <span>{enrollment.completed ? 'Revisar' : 'Continuar'}</span>
                  </Link>
                  {enrollment.completed && (
                    (enrollment as any).certificate?.link_pdf ? (
                      <a
                        href={(enrollment as any).certificate.link_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline flex items-center space-x-2"
                      >
                        <FaCertificate />
                        <span>Baixar certificado</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn-outline flex items-center space-x-2"
                        onClick={() => navigate(`/pagamento-certificado/${enrollment.course_id}`)}
                      >
                        <FaCertificate />
                        <span>Obter certificado</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
