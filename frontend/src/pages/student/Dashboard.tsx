import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, Enrollment, Certificate } from '../../types';
import { FaBook, FaCertificate, FaTrophy, FaChartLine, FaPaperPlane, FaArrowRight } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeEnrollment } from '../../lib/normalizeEnrollment';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
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
  const [questionForm, setQuestionForm] = useState({
    subject: '',
    message: '',
  });
  const [sendingQuestion, setSendingQuestion] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
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
      setAvgProgress(0);
      setRecentCourses((enrollmentsRes.data || []).map(normalizeEnrollment).slice(0, 3));
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

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setQuestionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingQuestion(true);
    try {
      const subject = questionForm.subject.trim();
      const message = questionForm.message.trim();
      if (!subject || !message) {
        throw new Error('Preencha o assunto e a duvida.');
      }
      toast.success('Duvida enviada. O professor respondera pela plataforma.');
      setQuestionForm({ subject: '', message: '' });
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar duvida.');
    } finally {
      setSendingQuestion(false);
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
                  <a
                    href={cert.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]"
                  >
                    <FaCertificate className="text-2xl" />
                  </a>
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

      <div className="card mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Tirar duvidas com o professor</h2>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Respostas chegam dentro da plataforma</span>
        </div>
        <form onSubmit={handleQuestionSubmit} className="space-y-4">
          <input
            name="subject"
            value={questionForm.subject}
            onChange={handleQuestionChange}
            placeholder="Assunto da duvida"
            className="input-field"
            required
          />
          <textarea
            name="message"
            value={questionForm.message}
            onChange={handleQuestionChange}
            placeholder="Descreva sua pergunta para o professor"
            className="input-field min-h-[140px]"
            required
          />
          <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={sendingQuestion}>
            {sendingQuestion ? 'Enviando...' : 'Enviar duvida'}
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
