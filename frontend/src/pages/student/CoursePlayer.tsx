import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Lesson, Progress } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaCircle, FaDownload, FaArrowLeft, FaCertificate, FaPlay } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    loadCourse();
  }, [id]);

  useEffect(() => {
    if (enrollmentId) {
      loadProgress();
    }
  }, [enrollmentId]);

  useEffect(() => {
    if (!selectedLesson) {
      setNote('');
      return;
    }
    const stored = localStorage.getItem(`maextria_note_${selectedLesson.id}`);
    setNote(stored || '');
  }, [selectedLesson]);

  const loadCourse = async () => {
    try {
      if (!user) {
        toast.error('Faça login para acessar o curso');
        navigate('/login');
        return;
      }

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('matriculas')
        .select('*')
        .eq('curso_id', id)
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (enrollmentError) {
        throw enrollmentError;
      }

      if (!enrollment) {
        toast.error('Você não está matriculado neste curso');
        navigate('/student/my-courses');
        return;
      }
      setEnrollmentId(enrollment.id);

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
        course_id: module.curso_id,
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

      const normalizedCourse = normalizeCourse({
        ...courseData,
        modules: mappedModules,
      });
      setCourse(normalizedCourse);

      if (normalizedCourse.modules?.[0]?.lessons?.[0]) {
        setSelectedLesson(normalizedCourse.modules[0].lessons[0]);
      }
    } catch (error) {
      toast.error('Erro ao carregar curso');
      navigate('/student/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!enrollmentId) return;
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('progresso_aula')
        .select('*')
        .eq('usuario_id', user.id);
      if (error) {
        throw error;
      }
      const mapped = (data || []).map((item: any) => ({
        ...item,
        lesson_id: item.aula_id,
      }));
      setProgress(mapped);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const isLessonCompleted = (lessonId: string | number) => {
    return progress.some((p) => String(p.lesson_id) === String(lessonId) && p.completed);
  };

  const markLessonComplete = async (lessonId: string | number) => {
    if (!enrollmentId) return;
    try {
      if (!user) return;
      const { error } = await supabase
        .from('progresso_aula')
        .upsert({
          usuario_id: user.id,
          aula_id: lessonId,
          concluido: true,
          concluido_em: new Date().toISOString(),
        }, { onConflict: 'usuario_id,aula_id' });
      if (error) {
        throw error;
      }
      await loadProgress();
      toast.success('Aula marcada como concluída!');
    } catch (error) {
      toast.error('Erro ao marcar aula como concluída');
    }
  };

  const getCertificate = async () => {
    if (!enrollmentId) return;
    toast('Em breve: emissão automática de certificados.');
  };

  const saveNote = () => {
    if (!selectedLesson) return;
    localStorage.setItem(`maextria_note_${selectedLesson.id}`, note);
    toast.success('Anotacao salva.');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0;
  const completedLessons = progress.filter((p) => p.completed).length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = progressPercentage === 100;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="max-w-[1400px] mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
        <div className="flex flex-col gap-6 mb-8">
          <button
            onClick={() => navigate('/student/my-courses')}
            className="text-sm uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] flex items-center gap-2 hover:text-[hsl(var(--primary))] transition"
          >
            <FaArrowLeft />
            Voltar aos cursos
          </button>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Player do curso</p>
              <h1 className="headline-font text-4xl md:text-5xl">{course.title}</h1>
            </div>
            <div className="min-w-[240px]">
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2">
                <div
                  className="bg-[hsl(var(--primary))] h-2 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                {completedLessons} de {totalLessons} aulas concluídas
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <div className="card">
              {selectedLesson ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    <FaPlay />
                    <span>Aula em andamento</span>
                  </div>
                  <h2 className="headline-font text-3xl mb-4">{selectedLesson.title}</h2>

                  {selectedLesson.video_url && (
                    <div className="aspect-video bg-[hsl(var(--foreground))] rounded-[12px] mb-6 overflow-hidden">
                      <iframe
                        src={selectedLesson.video_url}
                        className="w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {selectedLesson.content && (
                    <div className="prose max-w-none mb-6">
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                    </div>
                  )}

                  {selectedLesson.materials && selectedLesson.materials.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-3">Materiais da Aula</h3>
                      <div className="space-y-2">
                        {selectedLesson.materials.map((material) => (
                          <a
                            key={material.id}
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-[12px] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition"
                          >
                            <FaDownload />
                            <span>{material.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Anotacoes pessoais</h3>
                      <button type="button" onClick={saveNote} className="btn-outline">
                        Salvar
                      </button>
                    </div>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Registre insights, referencias e proximos passos..."
                      className="input-field min-h-[140px]"
                    />
                  </div>

                  <div className="mt-8">
                    {isLessonCompleted(selectedLesson.id) ? (
                      <button className="btn-secondary">
                        <FaCheckCircle className="inline mr-2" />
                        Aula concluída
                      </button>
                    ) : (
                      <button
                        onClick={() => markLessonComplete(selectedLesson.id)}
                        className="btn-accent"
                      >
                        Marcar como concluída
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[hsl(var(--muted-foreground))]">Selecione uma aula para começar</p>
                </div>
              )}
            </div>

            {isCompleted && (
              <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Certificado</p>
                  <p className="text-lg font-semibold">Seu curso esta completo</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Gere seu certificado e finalize esta etapa.
                  </p>
                </div>
                <button onClick={getCertificate} className="btn-accent flex items-center gap-2">
                  <FaCertificate />
                  Obter certificado
                </button>
              </div>
            )}
          </div>

          <aside className="card h-fit sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Conteúdo do curso</h3>
            <div className="space-y-6">
              {course.modules?.map((module) => (
                <div key={module.id}>
                  <p className="text-sm uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mb-3">
                    {module.title}
                  </p>
                  <div className="space-y-2">
                    {module.lessons?.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`w-full text-left p-3 rounded-[12px] transition flex items-center gap-3 border ${
                          selectedLesson?.id === lesson.id
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                            : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        {isLessonCompleted(lesson.id) ? (
                          <FaCheckCircle className="text-[hsl(var(--primary))] flex-shrink-0" />
                        ) : (
                          <FaCircle className="text-[hsl(var(--border))] flex-shrink-0" />
                        )}
                        <span className="flex-grow text-sm">{lesson.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
