import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, Enrollment, Certificate, Trilha, Course, ObjetivoAluno } from '../../types';
import { FaBook, FaCertificate, FaTrophy, FaChartLine, FaArrowRight, FaPaperPlane, FaRoute, FaClock, FaBullseye, FaLightbulb, FaTimes, FaCheck, FaPlus, FaFileAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import ThemeToggle from '../../components/ThemeToggle';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface TrilhaEmAndamento extends Trilha {
  cursos_progresso?: Array<{
    curso_id: string;
    curso_titulo: string;
    curso_thumbnail?: string;
    curso_duracao?: number;
    progresso: number;
  }>;
  progresso_total?: number;
}

interface CertificadoPorMes {
  mes: string;
  concluidos: number;
  certificados: number;
  meta: number;
}

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentCourses, setRecentCourses] = useState<Enrollment[]>([]);
  const [, setCertificates] = useState<Certificate[]>([]);
  const [trilhasEmAndamento, setTrilhasEmAndamento] = useState<TrilhaEmAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgProgress, setAvgProgress] = useState(0);

  // Objetivos
  const [objetivo, setObjetivo] = useState<ObjetivoAluno | null>(null);
  const [showObjetivoModal, setShowObjetivoModal] = useState(false);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [objetivoForm, setObjetivoForm] = useState({
    objetivo_profissional: '',
    o_que_quer_alcancar: '',
    prazo_meses: 12,
    cursos_selecionados: [] as string[],
  });
  const [savingObjetivo, setSavingObjetivo] = useState(false);

  // Grafico de certificacoes
  const [chartData, setChartData] = useState<CertificadoPorMes[]>([]);

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  const loadDashboard = async () => {
    try {
      const userId = user?.id;

      // Carregar todos os cursos para seleção de objetivo
      const { data: cursosData } = await supabase
        .from('cursos')
        .select('*')
        .eq('ativo', true)
        .order('titulo');

      setAllCourses((cursosData || []).map(normalizeCourse));

      const [enrollmentsRes, certsRes] = await Promise.all([
        supabase
          .from('matriculas')
          .select('*, cursos(*)')
          .order('data_matricula', { ascending: false }),
        supabase
          .from('certificados')
          .select('*, cursos(*)')
          .order('emitido_em', { ascending: false }),
      ]);

      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (certsRes.error) throw certsRes.error;

      const filteredEnrollmentsRaw = (enrollmentsRes.data || []).filter((row: any) => row.cursos);
      const filteredCertsRaw = (certsRes.data || []).filter((row: any) => row.cursos);
      const enrolled = filteredEnrollmentsRaw.length || 0;
      const completed = filteredCertsRaw.length || 0;
      const active = Math.max(enrolled - completed, 0);

      setStats({
        in_progress_courses: active,
        completed_courses: completed,
        certificates: completed,
      });

      const normalizedEnrollments = filteredEnrollmentsRaw.map(normalizeEnrollment);
      const courseIds = normalizedEnrollments.map((item) => item.course_id).filter(Boolean);

      let enrollmentsWithProgress = normalizedEnrollments;

      if (userId && courseIds.length > 0) {
        const [modulesRes, progressRes, quizzesRes, responsesRes] = await Promise.all([
          supabase.from('modulos').select('id, curso_id, aulas(id)').in('curso_id', courseIds),
          supabase.from('progresso_aula').select('concluido, aulas!inner(modulos!inner(curso_id))').eq('usuario_id', userId),
          supabase.from('questionarios').select('id, curso_id').in('curso_id', courseIds),
          supabase.from('respostas_questionario').select('questionario_id, aprovado').eq('usuario_id', userId),
        ]);

        if (!modulesRes.error && !progressRes.error && !quizzesRes.error && !responsesRes.error) {
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

          enrollmentsWithProgress = normalizedEnrollments.map((enrollment) => {
            const courseId = String(enrollment.course_id);
            const totalLessons = lessonsByCourse[courseId] || 0;
            const completedLessons = completedLessonsByCourse[courseId] || 0;
            const totalQuizzes = quizzesByCourse[courseId] || 0;
            const completedQuizzes = completedQuizzesByCourse[courseId] || 0;
            const totalItems = totalLessons + totalQuizzes;
            const completedItems = completedLessons + completedQuizzes;
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
            const isCompleted = totalLessons > 0 && completedLessons === totalLessons && completedQuizzes === totalQuizzes;

            return { ...enrollment, progress, completed: isCompleted };
          });
        }
      }

      const totalProgress = enrollmentsWithProgress.reduce((sum, item) => sum + (item.progress || 0), 0);
      setAvgProgress(enrollmentsWithProgress.length > 0 ? totalProgress / enrollmentsWithProgress.length : 0);
      setRecentCourses(enrollmentsWithProgress.slice(0, 3));

      const normalizedCerts = filteredCertsRaw.map((cert: any) => ({
        ...cert,
        certificate_url: cert.link_pdf ?? cert.certificate_url ?? cert.certificateUrl ?? '',
        issued_at: cert.emitido_em ?? cert.issued_at,
        course: {
          id: cert.curso_id ?? cert.course_id ?? cert.cursos?.id,
          title: cert.cursos?.titulo ?? cert.course_title ?? '',
          description: cert.cursos?.descricao ?? '',
          price: cert.cursos?.preco_certificado ?? cert.price ?? 0,
          teacher_id: '',
          teacher_name: cert.teacher_name,
          level: cert.cursos?.nivel ?? cert.level ?? cert.course_level ?? '',
          is_published: true,
          created_at: cert.emitido_em ?? cert.issued_at,
          updated_at: cert.emitido_em ?? cert.issued_at,
          thumbnail: cert.cursos?.imagem_capa_url ?? cert.cover_image,
        },
      }));
      setCertificates(normalizedCerts);

      // Carregar objetivo do aluno
      if (userId) {
        const { data: objetivoData } = await supabase
          .from('objetivos_aluno')
          .select(`*, objetivos_cursos(*, cursos(*))`)
          .eq('usuario_id', userId)
          .single();

        if (objetivoData) {
          setObjetivo({
            ...objetivoData,
            cursos: objetivoData.objetivos_cursos?.map((oc: any) => ({
              ...oc,
              curso: oc.cursos ? normalizeCourse(oc.cursos) : null,
            })),
          });

          // Montar dados do grafico baseado no objetivo
          buildChartData(objetivoData, normalizedCerts, enrollmentsWithProgress);
        }

        // Carregar trilhas em andamento
        const { data: matriculasTrilha, error: trilhasError } = await supabase
          .from('matriculas_trilha')
          .select(`*, trilhas(*, trilha_cursos(*, cursos(*)))`)
          .eq('usuario_id', userId);

        if (!trilhasError && matriculasTrilha) {
          const trilhasComProgresso: TrilhaEmAndamento[] = matriculasTrilha
            .filter((mt: any) => mt.trilhas)
            .map((mt: any) => {
              const trilha = mt.trilhas;
              const cursosProgresso = trilha.trilha_cursos?.map((tc: any) => {
                const curso = tc.cursos ? normalizeCourse(tc.cursos) : null;
                const enrollment = enrollmentsWithProgress.find(e => String(e.course_id) === String(tc.curso_id));
                return {
                  curso_id: tc.curso_id,
                  curso_titulo: curso?.title || 'Curso',
                  curso_thumbnail: curso?.thumbnail,
                  curso_duracao: curso?.duration_hours,
                  progresso: enrollment?.progress || 0,
                };
              }) || [];

              const progressoTotal = cursosProgresso.length > 0
                ? Math.round(cursosProgresso.reduce((sum: number, c: any) => sum + c.progresso, 0) / cursosProgresso.length)
                : 0;

              return { ...trilha, cursos_progresso: cursosProgresso, progresso_total: progressoTotal };
            });

          setTrilhasEmAndamento(trilhasComProgresso);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildChartData = (obj: any, certs: any[], enrollments: Enrollment[]) => {
    const prazoMeses = obj.prazo_meses || 12;
    const metaCursos = obj.objetivos_cursos?.length || 0;
    const metaPorMes = metaCursos / prazoMeses;

    // Agrupar certificados por mes
    const certsPorMes: Record<string, number> = {};
    const concluidosPorMes: Record<string, number> = {};

    certs.forEach((cert: any) => {
      if (cert.issued_at) {
        const date = new Date(cert.issued_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        certsPorMes[key] = (certsPorMes[key] || 0) + 1;
      }
    });

    // Contar cursos concluidos (100%) por mes de matricula
    enrollments.filter(e => e.completed).forEach(e => {
      const date = new Date(e.enrolled_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      concluidosPorMes[key] = (concluidosPorMes[key] || 0) + 1;
    });

    // Gerar ultimos 6 meses
    const meses: CertificadoPorMes[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      meses.push({
        mes: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
        concluidos: concluidosPorMes[key] || 0,
        certificados: certsPorMes[key] || 0,
        meta: Math.round(metaPorMes * 10) / 10,
      });
    }

    setChartData(meses);
  };

  const handleSaveObjetivo = async () => {
    if (!objetivoForm.objetivo_profissional.trim()) {
      toast.error('Informe seu objetivo profissional');
      return;
    }

    setSavingObjetivo(true);
    try {
      const userId = user?.id;
      if (!userId) throw new Error('Usuario nao autenticado');

      // Upsert objetivo
      const { data: savedObjetivo, error: objError } = await supabase
        .from('objetivos_aluno')
        .upsert({
          usuario_id: userId,
          objetivo_profissional: objetivoForm.objetivo_profissional.trim(),
          o_que_quer_alcancar: objetivoForm.o_que_quer_alcancar.trim() || null,
          prazo_meses: objetivoForm.prazo_meses,
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'usuario_id' })
        .select()
        .single();

      if (objError) throw objError;

      // Deletar cursos antigos
      await supabase
        .from('objetivos_cursos')
        .delete()
        .eq('objetivo_id', savedObjetivo.id);

      // Inserir novos cursos
      if (objetivoForm.cursos_selecionados.length > 0) {
        const cursosToInsert = objetivoForm.cursos_selecionados.map((cursoId, index) => ({
          objetivo_id: savedObjetivo.id,
          curso_id: cursoId,
          ordem: index,
        }));

        const { error: insertError } = await supabase
          .from('objetivos_cursos')
          .insert(cursosToInsert);

        if (insertError) throw insertError;
      }

      toast.success('Objetivo salvo com sucesso!');
      setShowObjetivoModal(false);
      loadDashboard();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar objetivo');
    } finally {
      setSavingObjetivo(false);
    }
  };

  const openObjetivoModal = () => {
    if (objetivo) {
      setObjetivoForm({
        objetivo_profissional: objetivo.objetivo_profissional || '',
        o_que_quer_alcancar: objetivo.o_que_quer_alcancar || '',
        prazo_meses: objetivo.prazo_meses || 12,
        cursos_selecionados: objetivo.cursos?.map(c => c.curso_id) || [],
      });
    } else {
      setObjetivoForm({
        objetivo_profissional: '',
        o_que_quer_alcancar: '',
        prazo_meses: 12,
        cursos_selecionados: [],
      });
    }
    setShowObjetivoModal(true);
  };

  const toggleCursoSelecionado = (cursoId: string) => {
    setObjetivoForm(prev => ({
      ...prev,
      cursos_selecionados: prev.cursos_selecionados.includes(cursoId)
        ? prev.cursos_selecionados.filter(id => id !== cursoId)
        : [...prev.cursos_selecionados, cursoId],
    }));
  };

  // Gerar dica personalizada
  const getDica = () => {
    if (!objetivo) return null;

    const cursosObjetivo = objetivo.cursos || [];
    const cursosPendentes = cursosObjetivo.filter(oc => {
      const enrollment = recentCourses.find(e => String(e.course_id) === oc.curso_id);
      return !enrollment || enrollment.progress < 100;
    });

    if (cursosPendentes.length === 0) {
      return { tipo: 'sucesso', texto: 'Parabens! Voce concluiu todos os cursos do seu objetivo!' };
    }

    const cursoEmAndamento = cursosPendentes.find(oc => {
      const enrollment = recentCourses.find(e => String(e.course_id) === oc.curso_id);
      return enrollment && enrollment.progress > 0 && enrollment.progress < 100;
    });

    if (cursoEmAndamento) {
      const enrollment = recentCourses.find(e => String(e.course_id) === cursoEmAndamento.curso_id);
      return {
        tipo: 'andamento',
        texto: `Continue o curso "${cursoEmAndamento.curso?.title}" - voce ja esta em ${enrollment?.progress}%!`,
        cursoId: cursoEmAndamento.curso_id,
      };
    }

    const proximoCurso = cursosPendentes[0];
    return {
      tipo: 'iniciar',
      texto: `Comece o curso "${proximoCurso.curso?.title}" para avancar no seu objetivo!`,
      cursoId: proximoCurso.curso_id,
    };
  };

  const dica = getDica();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Painel do aluno</p>
          <h1 className="headline-font text-4xl md:text-5xl">Sua jornada em progresso</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <Link to="/courses" className="btn-accent inline-flex items-center gap-2">
            Explorar cursos
            <FaArrowRight />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Cursos ativos', value: stats.in_progress_courses || 0, icon: <FaBook /> },
          { label: 'Concluidos', value: stats.completed_courses || 0, icon: <FaTrophy /> },
          { label: 'Certificados', value: stats.certificates || 0, icon: <FaCertificate /> },
          { label: 'Progresso medio', value: avgProgress ? `${Math.round(avgProgress)}%` : '0%', icon: <FaChartLine /> },
        ].map((item) => (
          <div key={item.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</p>
                <p className="text-3xl font-semibold mt-2">{item.value}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))] text-xl">
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Objetivo Profissional */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <FaBullseye className="text-[hsl(var(--primary))]" />
              <h2 className="text-lg sm:text-xl font-semibold whitespace-nowrap">Meu Objetivo</h2>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                to="/student/curriculum"
                className="btn-outline text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap"
                style={{ minHeight: '36px', padding: '8px 12px' }}
              >
                <FaFileAlt size={12} className="flex-shrink-0" />
                <span>Currículo</span>
              </Link>
              <button
                onClick={openObjetivoModal}
                className="btn-outline text-xs sm:text-sm whitespace-nowrap"
                style={{ minHeight: '36px', padding: '8px 12px' }}
              >
                {objetivo ? 'Editar' : 'Definir'}
              </button>
            </div>
          </div>

          {objetivo ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Objetivo</p>
                <p className="font-medium">{objetivo.objetivo_profissional}</p>
              </div>
              {objetivo.o_que_quer_alcancar && (
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">O que quero alcancar</p>
                  <p className="font-medium">{objetivo.o_que_quer_alcancar}</p>
                </div>
              )}
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Prazo</p>
                  <p className="font-medium">{objetivo.prazo_meses} meses</p>
                </div>
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Certificacoes meta</p>
                  <p className="font-medium">{objetivo.cursos?.length || 0} cursos</p>
                </div>
              </div>

              {/* Dica personalizada */}
              {dica && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  dica.tipo === 'sucesso' ? 'bg-green-50 border border-green-200' :
                  'bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)]'
                }`}>
                  <FaLightbulb className={dica.tipo === 'sucesso' ? 'text-green-500 mt-0.5' : 'text-[hsl(var(--primary))] mt-0.5'} />
                  <div>
                    <p className={`text-sm ${dica.tipo === 'sucesso' ? 'text-green-700' : ''}`}>{dica.texto}</p>
                    {dica.cursoId && (
                      <Link
                        to={`/courses/${dica.cursoId}`}
                        className="text-sm font-medium text-[hsl(var(--primary))] hover:underline mt-1 inline-block"
                      >
                        {dica.tipo === 'andamento' ? 'Continuar' : 'Comecar'} →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaBullseye className="text-4xl text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <p className="text-[hsl(var(--muted-foreground))] mb-4">
                Defina seu objetivo profissional para acompanhar seu progresso
              </p>
              <button onClick={openObjetivoModal} className="btn-accent">
                Definir objetivo
              </button>
            </div>
          )}
        </div>

        {/* Grafico de Certificacoes */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Certificacoes ao longo do tempo</h2>
          {objetivo && chartData.length > 0 ? (
            <>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                A linha laranja indica quantas certificacoes voce precisa obter por mes para atingir seu objetivo em {objetivo.prazo_meses} meses ({chartData[0]?.meta?.toFixed(1) || 0} cert./mes)
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'meta') return [`${value.toFixed(1)} por mes`, 'Meta mensal'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="concluidos" name="Cursos concluidos" fill="hsl(var(--primary))" />
                  <Bar dataKey="certificados" name="Certificados obtidos" fill="hsl(var(--secondary))" />
                  <ReferenceLine
                    y={chartData[0]?.meta || 0}
                    stroke="orange"
                    strokeDasharray="5 5"
                    label={{
                      value: `Meta: ${chartData[0]?.meta?.toFixed(1) || 0}/mes`,
                      fill: 'orange',
                      fontSize: 11,
                      position: 'insideTopRight'
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 text-center">
                Mantenha-se acima da linha laranja para atingir suas {objetivo.cursos?.length || 0} certificacoes no prazo
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-[hsl(var(--muted-foreground))]">
              <p>Defina um objetivo para ver seu progresso</p>
            </div>
          )}
        </div>
      </div>

      {/* Cursos em andamento */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cursos em andamento</h2>
          <Link to="/student/my-courses" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
            Ver todos
          </Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              Voce nao possui cursos ativos no momento.
            </p>
            <Link to="/courses" className="btn-accent">
              Ir para a vitrine de cursos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCourses.map((enrollment) => (
              <Link
                key={enrollment.id}
                to={`/student/course/${enrollment.course_id}`}
                className="flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-[12px] hover:bg-[hsl(var(--muted))] transition"
              >
                <div className="flex-grow">
                  <h3 className="font-semibold">{enrollment.course?.title}</h3>
                  <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 mt-2">
                    <div className="bg-[hsl(var(--primary))] h-2 rounded-full" style={{ width: `${enrollment.progress}%` }} />
                  </div>
                </div>
                <div className="ml-4 text-[hsl(var(--primary))] font-semibold">{enrollment.progress}%</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Trilhas em Andamento */}
      {trilhasEmAndamento.length > 0 && (
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FaRoute className="text-orange-500" />
              <h2 className="text-xl font-semibold">Trilhas em andamento</h2>
            </div>
            <Link to="/student/my-courses" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
              Ver todas
            </Link>
          </div>
          <div className="space-y-6">
            {trilhasEmAndamento.map((trilha) => (
              <div key={trilha.id} className="border border-[hsl(var(--border))] rounded-[12px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{trilha.nome}</h3>
                  <span className="text-sm font-medium text-orange-500">{trilha.progresso_total}% concluido</span>
                </div>
                <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 mb-4">
                  <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${trilha.progresso_total}%` }} />
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {trilha.cursos_progresso?.map((curso) => (
                    <Link
                      key={curso.curso_id}
                      to={`/student/course/${curso.curso_id}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] transition"
                    >
                      <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden">
                        {curso.curso_thumbnail ? (
                          <img src={curso.curso_thumbnail} alt={curso.curso_titulo} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))]">
                            <span className="text-xs font-bold text-white">{curso.curso_titulo?.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{curso.curso_titulo}</p>
                        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                          <span>{curso.progresso}%</span>
                          {curso.curso_duracao && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                {curso.curso_duracao}h
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sugerir curso */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Nao encontrou o curso que precisa?</h2>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          Sugira um curso que voce gostaria de ver na plataforma. Sua sugestao vai direto para nossa equipe!
        </p>
        <Link to="#sugestao" onClick={() => {
          const el = document.getElementById('sugestao-form');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }} className="btn-accent inline-flex items-center gap-2">
          Sugerir curso
          <FaPaperPlane />
        </Link>
      </div>

      {/* Modal de Objetivo */}
      <AnimatePresence>
        {showObjetivoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowObjetivoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[hsl(var(--card))] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
                <h2 className="text-xl font-semibold text-[hsl(var(--member-strong))]">
                  Definir Objetivo Profissional
                </h2>
                <button
                  onClick={() => setShowObjetivoModal(false)}
                  className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition text-[hsl(var(--member-strong))]"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                    Qual seu objetivo profissional? *
                  </label>
                  <input
                    type="text"
                    value={objetivoForm.objetivo_profissional}
                    onChange={e => setObjetivoForm(prev => ({ ...prev, objetivo_profissional: e.target.value }))}
                    placeholder="Ex: Me tornar desenvolvedor full-stack"
                    className="input-field w-full text-[hsl(var(--member-strong))]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                    O que voce quer alcancar?
                  </label>
                  <textarea
                    value={objetivoForm.o_que_quer_alcancar}
                    onChange={e => setObjetivoForm(prev => ({ ...prev, o_que_quer_alcancar: e.target.value }))}
                    placeholder="Ex: Conseguir uma vaga em empresa de tecnologia, aumentar meu salario..."
                    className="input-field w-full min-h-[80px] text-[hsl(var(--member-strong))]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                    Em quanto tempo quer alcancar? *
                  </label>
                  <select
                    value={objetivoForm.prazo_meses}
                    onChange={e => setObjetivoForm(prev => ({ ...prev, prazo_meses: Number(e.target.value) }))}
                    className="input-field w-full text-[hsl(var(--member-strong))]"
                  >
                    <option value={3}>3 meses</option>
                    <option value={6}>6 meses</option>
                    <option value={12}>12 meses</option>
                    <option value={18}>18 meses</option>
                    <option value={24}>24 meses</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[hsl(var(--member-strong))]">
                    Quais certificacoes voce precisa? ({objetivoForm.cursos_selecionados.length} selecionado(s))
                  </label>
                  <p className="text-xs text-[hsl(var(--member-strong))] mb-3">
                    Selecione os cursos que fazem parte do seu objetivo
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {allCourses.map(course => {
                      const isSelected = objetivoForm.cursos_selecionados.includes(String(course.id));
                      return (
                        <button
                          key={course.id}
                          type="button"
                          onClick={() => toggleCursoSelecionado(String(course.id))}
                          className={`w-full text-left p-3 rounded-lg border transition flex items-center gap-3 ${
                            isSelected
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                              : 'border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground))]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                            isSelected ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--muted-foreground))]'
                          }`}>
                            {isSelected && <FaCheck className="text-white text-xs" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-[hsl(var(--member-strong))]">
                              {course.title}
                            </p>
                            {course.category && (
                              <p className="text-xs text-[hsl(var(--member-strong))]">{course.category}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowObjetivoModal(false);
                      setTimeout(() => {
                        const el = document.querySelector('.card:last-child');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 300);
                    }}
                    className="text-sm text-[hsl(var(--primary))] hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    <FaPlus className="text-xs" />
                    Nao encontrou? Sugira um curso
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
                <button onClick={() => setShowObjetivoModal(false)} disabled={savingObjetivo} className="btn-outline">
                  Cancelar
                </button>
                <button onClick={handleSaveObjetivo} disabled={savingObjetivo || !objetivoForm.objetivo_profissional.trim()} className="btn-accent">
                  {savingObjetivo ? 'Salvando...' : 'Salvar objetivo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
