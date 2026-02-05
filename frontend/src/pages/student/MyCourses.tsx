import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Enrollment, Trilha } from '../../types';
import { supabase } from '../../lib/supabase';
import { FaPlay, FaCertificate, FaClock, FaRoute } from 'react-icons/fa';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { useAuthStore } from '../../lib/store';

interface TrilhaComProgresso extends Trilha {
  cursos_progresso?: Array<{
    curso_id: string;
    curso_titulo: string;
    curso_thumbnail?: string;
    progresso: number;
  }>;
  progresso_total?: number;
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [trilhas, setTrilhas] = useState<TrilhaComProgresso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'trilhas'>('all');
  const [certBannerOpen, setCertBannerOpen] = useState(false);
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

      // Carregar trilhas do aluno
      const { data: matriculasTrilha, error: trilhasError } = await supabase
        .from('matriculas_trilha')
        .select(`
          *,
          trilhas(
            *,
            trilha_cursos(
              *,
              cursos(*)
            )
          )
        `)
        .eq('usuario_id', user.id);

      if (!trilhasError && matriculasTrilha) {
        const trilhasComProgresso: TrilhaComProgresso[] = matriculasTrilha
          .filter((mt: any) => mt.trilhas)
          .map((mt: any) => {
            const trilha = mt.trilhas;
            const cursosProgresso = trilha.trilha_cursos?.map((tc: any) => {
              const curso = tc.cursos ? normalizeCourse(tc.cursos) : null;
              const enrollment = withProgress.find(
                e => String(e.course_id) === String(tc.curso_id)
              );
              return {
                curso_id: tc.curso_id,
                curso_titulo: curso?.title || 'Curso',
                curso_thumbnail: curso?.thumbnail,
                progresso: enrollment?.progress || 0,
              };
            }) || [];

            const progressoTotal = cursosProgresso.length > 0
              ? Math.round(cursosProgresso.reduce((sum: number, c: any) => sum + c.progresso, 0) / cursosProgresso.length)
              : 0;

            return {
              ...trilha,
              cursos_progresso: cursosProgresso,
              progresso_total: progressoTotal,
            };
          });

        setTrilhas(trilhasComProgresso);
      }
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
          <h1 className="headline-font text-4xl md:text-5xl">Minhas capacitacoes ativas</h1>
        </div>
        <Link to="/courses" className="btn-accent">
          Explorar cursos
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'btn-accent' : 'btn-outline text-[hsl(var(--member-strong))]'}
        >
          Todos ({enrollments.length})
        </button>
        <button
          onClick={() => setFilter('in-progress')}
          className={filter === 'in-progress' ? 'btn-accent' : 'btn-outline text-[hsl(var(--member-strong))]'}
        >
          Em andamento ({enrollments.filter((e) => !e.completed).length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={filter === 'completed' ? 'btn-accent' : 'btn-outline text-[hsl(var(--member-strong))]'}
        >
          Concluidos ({enrollments.filter((e) => e.completed).length})
        </button>
        {trilhas.length > 0 && (
          <button
            onClick={() => setFilter('trilhas')}
            className={`${filter === 'trilhas' ? 'bg-orange-500 text-white' : 'btn-outline text-[hsl(var(--member-strong))]'} px-4 py-2 rounded-lg flex items-center gap-2`}
          >
            <FaRoute />
            Trilhas ({trilhas.length})
          </button>
        )}
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setCertBannerOpen((prev) => !prev)}
          className="w-full text-left rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition hover:border-[hsl(var(--secondary))]/60"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">
                Certificação de cursos conforme Lei 9.394/96 e Decreto 5.154/04
              </p>
            </div>
            <span className="text-sm text-[hsl(var(--secondary))] font-semibold">
              {certBannerOpen ? 'Fechar' : 'Ler mais'}
            </span>
          </div>
          {certBannerOpen && (
            <div className="mt-4 space-y-3 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              <p>
                Nossos cursos são 100% on-line, de caráter livre, voltados para o aperfeiçoamento profissional e oferecidos em nível básico.
              </p>
              <p>
                Não se tratam de cursos de graduação, extensão universitária ou pós-graduação.
              </p>
              <p>
                O título do curso não equivale a uma formação profissional regulamentada, e sua certificação não autoriza o exercício de atividades que dependam de registro em conselhos ou órgãos fiscalizadores.
              </p>
              <p>
                Os cursos não possuem reconhecimento ou validação junto a órgãos como MEC, CONTRAN, DENATRAN, CIRETRAN, DETRAN, CETRAN, CONTRANDIFE, COFFITO, CRO, CRM, CFP, CREA, entre outros.
              </p>
              <p>
                A emissão do certificado está condicionada à aprovação na avaliação final e ao cumprimento de todos os requisitos previstos nos Termos de Uso da plataforma Elevo, incluindo a carga horária mínima de estudos.
              </p>
              <p>
                Nossos certificados seguem as diretrizes do Ministério da Educação e são válidos em todo o território nacional, com ampla aceitação no mercado. Eles estão em conformidade com a Lei nº 9.394/96 e o Decreto Presidencial nº 5.154/04, podendo ser utilizados para diversos fins.
              </p>
            </div>
          )}
        </button>
      </div>

      {/* Visualizacao de Trilhas */}
      {filter === 'trilhas' ? (
        trilhas.length === 0 ? (
          <div className="card text-center py-12">
            <FaRoute className="text-4xl text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Voce nao esta inscrito em nenhuma trilha.
            </p>
            <Link to="/courses?filter=trilhas" className="btn-accent">
              Explorar trilhas
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {trilhas.map((trilha) => (
              <div key={trilha.id} className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <FaRoute className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{trilha.nome}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        {trilha.cursos_progresso?.length || 0} curso(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">{trilha.progresso_total}%</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">concluido</p>
                  </div>
                </div>

                <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 mb-4">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${trilha.progresso_total}%` }}
                  />
                </div>

                <div className="space-y-3">
                  {trilha.cursos_progresso?.map((curso) => (
                    <Link
                      key={curso.curso_id}
                      to={`/student/course/${curso.curso_id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                          {curso.curso_thumbnail ? (
                            <img
                              src={curso.curso_thumbnail}
                              alt={curso.curso_titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                              <span className="text-sm font-bold text-white">
                                {curso.curso_titulo?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{curso.curso_titulo}</p>
                          <div className="w-24 bg-[hsl(var(--border))] rounded-full h-1.5 mt-1">
                            <div
                              className="bg-[hsl(var(--primary))] h-1.5 rounded-full"
                              style={{ width: `${curso.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[hsl(var(--primary))]">
                          {curso.progresso}%
                        </span>
                        <FaPlay className="text-[hsl(var(--muted-foreground))]" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredEnrollments.length === 0 ? (
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
                  {enrollment.course?.duration_hours && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
                      <FaClock />
                      Carga horária: {enrollment.course.duration_hours}h
                    </p>
                  )}
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
                    className="btn-accent flex flex-row items-center gap-2 whitespace-nowrap"
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
                        className="btn-outline flex flex-row items-center gap-2 whitespace-nowrap"
                      >
                        <FaCertificate />
                        <span>Baixar certificado</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="btn-outline flex flex-row items-center gap-2 whitespace-nowrap"
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
