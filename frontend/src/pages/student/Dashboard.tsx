import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, Enrollment, Certificate } from '../../types';
import { FaBook, FaCertificate, FaTrophy, FaChartLine, FaPaperPlane, FaArrowRight, FaInbox, FaTrash } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentCourses, setRecentCourses] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgProgress, setAvgProgress] = useState(0);
  const [suggestion, setSuggestion] = useState({
    course: '',
    reason: '',
  });
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mailBlocked, setMailBlocked] = useState(false);
  const [mailBlockedMessage, setMailBlockedMessage] = useState('Correio interno temporariamente indisponivel.');
  const [threads, setThreads] = useState<Array<any>>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Array<any>>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'new'>('inbox');
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [modules, setModules] = useState<Array<{ id: string; title: string }>>([]);
  const [lessons, setLessons] = useState<Array<{ id: string; title: string }>>([]);
  const [compose, setCompose] = useState({
    courseId: '',
    moduleId: '',
    lessonId: '',
    subject: '',
    body: '',
  });
  const [sendingQuestion, setSendingQuestion] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadMessaging();
  }, [user?.id]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  const loadDashboard = async () => {
    try {
      const userId = user?.id;
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

      if (enrollmentsRes.error) {
        throw enrollmentsRes.error;
      }
      if (certsRes.error) {
        throw certsRes.error;
      }

      const enrolled = enrollmentsRes.data?.length || 0;
      const completed = certsRes.data?.length || 0;
      const active = Math.max(enrolled - completed, 0);
      setStats({
        in_progress_courses: active,
        completed_courses: completed,
        certificates: completed,
      });
      const normalizedEnrollments = (enrollmentsRes.data || []).map(normalizeEnrollment);
      const courseIds = normalizedEnrollments.map((item) => item.course_id).filter(Boolean);

      let enrollmentsWithProgress = normalizedEnrollments;

      if (userId && courseIds.length > 0) {
        const [modulesRes, progressRes, quizzesRes, responsesRes] = await Promise.all([
          supabase
            .from('modulos')
            .select('id, curso_id, aulas(id)')
            .in('curso_id', courseIds),
          supabase
            .from('progresso_aula')
            .select('concluido, aulas!inner(modulos!inner(curso_id))')
            .eq('usuario_id', userId),
          supabase
            .from('questionarios')
            .select('id, curso_id')
            .in('curso_id', courseIds),
          supabase
            .from('respostas_questionario')
            .select('questionario_id, aprovado')
            .eq('usuario_id', userId),
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
            const completed = totalLessons > 0 && completedLessons === totalLessons && completedQuizzes === totalQuizzes;

            return {
              ...enrollment,
              progress,
              completed,
            };
          });
        }
      }

      const totalProgress = enrollmentsWithProgress.reduce((sum, item) => sum + (item.progress || 0), 0);
      setAvgProgress(enrollmentsWithProgress.length > 0 ? totalProgress / enrollmentsWithProgress.length : 0);
      setRecentCourses(enrollmentsWithProgress.slice(0, 3));
      setCertificates(
        (certsRes.data || []).map((cert: any) => ({
          ...cert,
          certificate_url:
            cert.link_pdf ?? cert.certificate_url ?? cert.certificateUrl ?? '',
          course: {
            id: cert.curso_id ?? cert.course_id ?? cert.cursos?.id,
            title: cert.cursos?.titulo ?? cert.course_title ?? '',
            description: cert.cursos?.descricao ?? '',
            price: cert.cursos?.preco_certificado ?? cert.price ?? 0,
            teacher_id: '',
            teacher_name: cert.teacher_name,
            is_published: true,
            created_at: cert.emitido_em ?? cert.issued_at,
            updated_at: cert.emitido_em ?? cert.issued_at,
            thumbnail: cert.cursos?.imagem_capa_url ?? cert.cover_image,
          },
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessaging = async () => {
    setThreadsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? null;
      setCurrentUserId(userId);

      const [{ data: configs }, { data: enrollments }] = await Promise.all([
        supabase
          .from('configuracoes_site')
          .select('chave, valor')
          .in('chave', ['correio_interno_bloqueado', 'correio_interno_mensagem']),
        userId
          ? supabase
              .from('matriculas')
              .select('curso_id, cursos(id, titulo)')
              .eq('usuario_id', userId)
              .order('data_matricula', { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const blockedValue = configs?.find((item) => item.chave === 'correio_interno_bloqueado')?.valor;
      const blockedMessage = configs?.find((item) => item.chave === 'correio_interno_mensagem')?.valor;
      setMailBlocked(blockedValue === '1');
      if (blockedMessage) {
        setMailBlockedMessage(blockedMessage);
      }

      const courseList = (enrollments || [])
        .map((row: any) => ({
          id: row.curso_id ?? row.cursos?.id,
          title: row.cursos?.titulo ?? 'Curso',
        }))
        .filter((item: any) => item.id);
      setCourses(courseList);

      const { data: threadsData } = await supabase
        .from('internal_threads')
        .select('id, type, subject, course_id, module_id, lesson_id, created_at, expires_at, created_by_role, recipient_role, cursos(titulo), modulos(titulo_modulo), aulas(titulo)')
        .order('created_at', { ascending: false });

      setThreads(threadsData || []);
      if ((threadsData || []).length > 0) {
        setSelectedThreadId(threadsData?.[0]?.id ?? null);
      } else {
        setSelectedThreadId(null);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const { data } = await supabase
        .from('internal_messages')
        .select('id, body, created_at, sender_id, sender_role')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      let messages = data || [];
      if (currentUserId && messages.length > 0) {
        const messageIds = messages.map((message) => message.id);
        const { data: deletions } = await supabase
          .from('internal_message_deletions')
          .select('message_id')
          .eq('user_id', currentUserId)
          .in('message_id', messageIds);
        const deletedSet = new Set((deletions || []).map((row: any) => row.message_id));
        messages = messages.filter((message) => !deletedSet.has(message.id));
      }
      setThreadMessages(messages);
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const progressData = [
    { month: 'Jan', progress: 20 },
    { month: 'Fev', progress: 35 },
    { month: 'Mar', progress: 50 },
    { month: 'Abr', progress: 65 },
    { month: 'Mai', progress: 80 },
  ];

  const handleSuggestionChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setSuggestion((prev) => ({ ...prev, [name]: value }));
  };

  const handleSuggestionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Você precisa estar logado para enviar uma sugestão.');
      }

      const course = suggestion.course.trim();
      const reason = suggestion.reason.trim();
      if (!course || !reason) {
        throw new Error('Preencha o curso e o motivo.');
      }

      const { error } = await supabase
        .from('curso_sugestoes')
        .insert({
          usuario_id: user.id,
          curso: course,
          motivo: reason,
        });

      if (error) throw error;

      toast.success('Sugestão enviada com sucesso!');
      setSuggestion({ course: '', reason: '' });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar sugestão.');
    } finally {
      setSending(false);
    }
  };

  const handleComposeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setCompose((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = event.target.value;
    setCompose((prev) => ({ ...prev, courseId, moduleId: '', lessonId: '' }));
    setModules([]);
    setLessons([]);
    if (!courseId) return;

    const { data } = await supabase
      .from('modulos')
      .select('id, titulo_modulo')
      .eq('curso_id', courseId)
      .order('ordem', { ascending: true });
    setModules((data || []).map((item: any) => ({ id: item.id, title: item.titulo_modulo })));
  };

  const handleModuleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const moduleId = event.target.value;
    setCompose((prev) => ({ ...prev, moduleId, lessonId: '' }));
    setLessons([]);
    if (!moduleId) return;

    const { data } = await supabase
      .from('aulas')
      .select('id, titulo')
      .eq('modulo_id', moduleId)
      .order('ordem', { ascending: true });
    setLessons((data || []).map((item: any) => ({ id: item.id, title: item.titulo })));
  };

  const handleSendQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mailBlocked) {
      toast.error(mailBlockedMessage);
      return;
    }
    if (!currentUserId) {
      toast.error('Você precisa estar logado para enviar.');
      return;
    }
    setSendingQuestion(true);
    try {
      const subject = compose.subject.trim();
      const body = compose.body.trim();
      if (!compose.courseId || !compose.moduleId || !compose.lessonId || !subject || !body) {
        throw new Error('Selecione curso, modulo e aula, e preencha assunto e mensagem.');
      }

      const { data: thread, error: threadError } = await supabase
        .from('internal_threads')
        .insert({
          type: 'course_question',
          subject,
          course_id: compose.courseId,
          module_id: compose.moduleId,
          lesson_id: compose.lessonId,
          created_by: currentUserId,
          created_by_role: user?.role ?? 'student',
        })
        .select('id')
        .single();
      if (threadError) throw threadError;

      const { error: messageError } = await supabase
        .from('internal_messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUserId,
          body,
          sender_role: user?.role ?? 'student',
        });
      if (messageError) throw messageError;

      toast.success('Duvida enviada. O professor respondera aqui.');
      setCompose({ courseId: '', moduleId: '', lessonId: '', subject: '', body: '' });
      setModules([]);
      setLessons([]);
      await loadMessaging();
      setSelectedThreadId(thread.id);
      setActiveTab('inbox');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar duvida.');
    } finally {
      setSendingQuestion(false);
    }
  };


  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('internal_message_deletions')
        .insert({ message_id: messageId, user_id: currentUserId });
      if (error) throw error;
      setThreadMessages((prev) => prev.filter((message) => message.id !== messageId));
      toast.success('Mensagem excluida.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir mensagem.');
    }
  };

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
        <Link to="/courses" className="btn-accent inline-flex items-center gap-2">
          Explorar cursos
          <FaArrowRight />
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: 'Cursos ativos',
            value: stats.in_progress_courses || 0,
            icon: <FaBook />,
          },
          {
            label: 'Concluidos',
            value: stats.completed_courses || 0,
            icon: <FaTrophy />,
          },
          {
            label: 'Certificados',
            value: stats.certificates || 0,
            icon: <FaCertificate />,
          },
          {
            label: 'Progresso medio',
            value: avgProgress ? `${Math.round(avgProgress)}%` : '0%',
            icon: <FaChartLine />,
          },
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

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Progresso ao longo do tempo</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="progress" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Certificados recentes</h2>
          {certificates.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))]">Nenhum certificado ainda</p>
          ) : (
            <div className="space-y-3">
              {certificates.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-[12px]">
                  <div>
                    <p className="font-semibold">{cert.course?.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Link
                    to="/student/my-courses"
                    className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]"
                  >
                    <FaCertificate className="text-2xl" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cursos em andamento</h2>
          <Link to="/student/my-courses" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
            Ver todos
          </Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">Você ainda não está inscrito em nenhum curso</p>
            <Link to="/courses" className="btn-accent">
              Explorar cursos
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
                    <div
                      className="bg-[hsl(var(--primary))] h-2 rounded-full"
                      style={{ width: `${enrollment.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-4 text-[hsl(var(--primary))] font-semibold">
                  {enrollment.progress}%
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaInbox />
            Mensagens
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={activeTab === 'inbox' ? 'btn-accent' : 'btn-outline'}
              onClick={() => setActiveTab('inbox')}
            >
              Caixa de entrada
            </button>
            <button
              type="button"
              className={activeTab === 'new' ? 'btn-accent' : 'btn-outline'}
              onClick={() => setActiveTab('new')}
            >
              Nova mensagem
            </button>
          </div>
        </div>

        {mailBlocked && (
          <div className="mb-4 rounded-[12px] border border-[hsl(38_90%_45%)] bg-[hsl(42_95%_90%)] p-3 text-sm text-[hsl(30_80%_30%)]">
            {mailBlockedMessage}
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Conversas</p>
            {threadsLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma mensagem ainda.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left p-3 rounded-[12px] border transition ${
                    selectedThreadId === thread.id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{thread.subject}</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                      {thread.type === 'broadcast' ? 'Comunicado' : 'Duvida'}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {thread.type === 'broadcast' ? 'Equipe MAEXTRIA' : 'Professor'}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'new' && (
              <form onSubmit={handleSendQuestion} className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Nova duvida</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <select
                    name="courseId"
                    value={compose.courseId}
                    onChange={handleCourseChange}
                    className="input-field"
                    disabled={mailBlocked}
                    required
                  >
                    <option value="">Curso</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  <select
                    name="moduleId"
                    value={compose.moduleId}
                    onChange={handleModuleChange}
                    className="input-field"
                    disabled={mailBlocked || !compose.courseId}
                    required
                  >
                    <option value="">Modulo</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                  </select>
                  <select
                    name="lessonId"
                    value={compose.lessonId}
                    onChange={handleComposeChange}
                    className="input-field"
                    disabled={mailBlocked || !compose.moduleId}
                    required
                  >
                    <option value="">Aula</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                    ))}
                  </select>
                </div>
                <input
                  name="subject"
                  value={compose.subject}
                  onChange={handleComposeChange}
                  placeholder="Assunto da duvida"
                  className="input-field"
                  disabled={mailBlocked}
                  required
                />
                <textarea
                  name="body"
                  value={compose.body}
                  onChange={handleComposeChange}
                  placeholder="Descreva sua pergunta para o professor"
                  className="input-field min-h-[140px]"
                  disabled={mailBlocked}
                  required
                />
                <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={sendingQuestion || mailBlocked}>
                  {sendingQuestion ? 'Enviando...' : 'Enviar duvida'}
                  <FaPaperPlane />
                </button>
              </form>
            )}

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Mensagens</p>
              {activeTab === 'inbox' && selectedThreadId ? (
                messagesLoading ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando mensagens...</p>
                ) : threadMessages.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem mensagens nesta conversa.</p>
                ) : (
                  <div className="space-y-3">
                    {threadMessages.map((message) => {
                      const isOwn = message.sender_id === currentUserId;
                      const senderRole = message.sender_role || 'student';
                      const canDelete = senderRole !== 'admin';
                      const bubbleClass = 'border border-black bg-black text-white';
                      const senderLabel = isOwn
                        ? 'Você'
                        : senderRole === 'admin'
                          ? 'Equipe MAEXTRIA'
                          : 'Professor';
                      return (
                        <div key={message.id} className={`rounded-[12px] border p-3 ${bubbleClass}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{senderLabel}</p>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                          <p className="text-sm mt-2 whitespace-pre-line text-white">{message.body}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                            {new Date(message.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Selecione uma conversa.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Sugerir novo curso</h2>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Sugestoes vao direto para nossa equipe</span>
        </div>
        <form onSubmit={handleSuggestionSubmit} className="space-y-4">
          <input
            name="course"
            value={suggestion.course}
            onChange={handleSuggestionChange}
            placeholder="Qual curso você gostaria de ver?"
            className="input-field"
            required
          />
          <textarea
            name="reason"
            value={suggestion.reason}
            onChange={handleSuggestionChange}
            placeholder="Conte por que esse tema e importante para você"
            className="input-field min-h-[120px]"
            required
          />
          <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar sugestao'}
            <FaPaperPlane />
          </button>
        </form>
      </div>

    </div>
  );
}
