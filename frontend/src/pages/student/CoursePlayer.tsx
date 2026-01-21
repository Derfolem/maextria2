import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Course, Lesson, Progress } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaCircle, FaDownload, FaArrowLeft, FaCertificate, FaPlay } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';
import DOMPurify from 'dompurify';

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

const getVideoData = (rawUrl: string) => {
  const url = rawUrl.trim();
  if (!url) return null;
  const youtubeMatch = url.match(YOUTUBE_REGEX);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${id}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }
  const vimeoMatch = url.match(VIMEO_REGEX);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      embedUrl: `https://player.vimeo.com/video/${id}`,
      thumbnailUrl: '',
    };
  }
  return { embedUrl: url, thumbnailUrl: '' };
};

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentId, setEnrollmentId] = useState<string | number | null>(null);
  const [activeVideoLessonId, setActiveVideoLessonId] = useState<string | number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [notes, setNotes] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);
  const [moduleQuizzes, setModuleQuizzes] = useState<Record<string, any>>({});
  const [finalQuiz, setFinalQuiz] = useState<any | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ percentual: number; aprovado: boolean } | null>(null);
  const [minScore, setMinScore] = useState(60);
  const [quizResponses, setQuizResponses] = useState<Record<string, boolean>>({});

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
      setNoteDraft('');
      setNotes([]);
      return;
    }
    setActiveVideoLessonId(null);
    const stored = localStorage.getItem(`maextria_note_${selectedLesson.id}`);
    if (!stored) {
      setNotes([]);
      setNoteDraft('');
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setNotes(parsed);
        setNoteDraft('');
        return;
      }
    } catch (error) {
      // Falls back to legacy single-note format.
    }

    setNotes([{
      id: `legacy-${selectedLesson.id}`,
      text: stored,
      createdAt: new Date().toISOString(),
    }]);
    setNoteDraft('');
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
      // Buscar todas as aulas do curso para pegar os IDs
      const allLessonIds: (string | number)[] = [];
      (modulesData || []).forEach((module: any) => {
        (module.aulas || []).forEach((lesson: any) => {
          allLessonIds.push(lesson.id);
        });
      });
      // Buscar imagens de todas as aulas
      let imagesByLesson: Record<string, string[]> = {};
      if (allLessonIds.length > 0) {
        const { data: imagesData } = await supabase
          .from('aula_imagens')
          .select('aula_id, url, ordem')
          .in('aula_id', allLessonIds);
        
        (imagesData || []).forEach((row: any) => {
          const key = String(row.aula_id);
          if (!imagesByLesson[key]) imagesByLesson[key] = ['', '', ''];
          const index = (row.ordem ?? 1) - 1;
          if (index >= 0 && index < 3) {
            imagesByLesson[key][index] = row.url;
          }
        });
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
            image_urls: imagesByLesson[String(lesson.id)] || [],
            order_index: lesson.ordem,
          })),
      }));

      const normalizedCourse = normalizeCourse({
        ...courseData,
        modules: mappedModules,
      });
      setCourse(normalizedCourse);

      const { data: quizzesData } = await supabase
        .from('questionarios')
        .select('*, questoes(*)')
        .eq('curso_id', id);
      const moduleMap: Record<string, any> = {};
      let final: any | null = null;
      (quizzesData || []).forEach((quiz: any) => {
        if (quiz.tipo === 'final') {
          final = quiz;
          return;
        }
        if (quiz.modulo_id) {
          moduleMap[String(quiz.modulo_id)] = quiz;
        }
      });
      setModuleQuizzes(moduleMap);
      setFinalQuiz(final);

      const quizIds = (quizzesData || []).map((quiz: any) => quiz.id);
      if (quizIds.length > 0) {
        const { data: responsesData } = await supabase
          .from('respostas_questionario')
          .select('questionario_id, aprovado')
          .eq('usuario_id', user.id)
          .in('questionario_id', quizIds);
        const responseMap = (responsesData || []).reduce((acc: Record<string, boolean>, item: any) => {
          acc[String(item.questionario_id)] = Boolean(item.aprovado);
          return acc;
        }, {});
        setQuizResponses(responseMap);
      } else {
        setQuizResponses({});
      }

      const { data: settingsData } = await supabase
        .from('configuracoes_site')
        .select('valor')
        .eq('chave', 'nota_minima_prova')
        .maybeSingle();
      if (settingsData?.valor) {
        const parsed = Number(settingsData.valor);
        if (!Number.isNaN(parsed)) {
          setMinScore(parsed);
        }
      }

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
        completed: item.concluido,
        completed_at: item.concluido_em,
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
      setProgress((prev) => {
        const existing = prev.find((item) => String(item.lesson_id) === String(lessonId));
        if (existing) {
          return prev.map((item) =>
            String(item.lesson_id) === String(lessonId)
              ? { ...item, completed: true, completed_at: new Date().toISOString() }
              : item
          );
        }
        return [
          ...prev,
          {
            id: lessonId,
            lesson_id: lessonId,
            user_id: user.id,
            completed: true,
            completed_at: new Date().toISOString(),
          } as Progress,
        ];
      });
      toast.success('Aula marcada como concluída!');
    } catch (error) {
      toast.error('Erro ao marcar aula como concluída');
    }
  };

  const getCertificate = async () => {
    if (!enrollmentId) return;
    if (!course?.id) {
      toast.error('Curso nao encontrado para emitir certificado.');
      return;
    }
    navigate(`/pagamento-certificado/${course.id}`);
  };

  const saveNote = () => {
    if (!selectedLesson) return;
    const trimmed = noteDraft.trim();
    if (!trimmed) {
      toast.error('Digite uma anotacao antes de salvar.');
      return;
    }
    const noteId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextNotes = [
      ...notes,
      {
        id: noteId,
        text: trimmed,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(`maextria_note_${selectedLesson.id}`, JSON.stringify(nextNotes));
    setNotes(nextNotes);
    setNoteDraft('');
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
  const lessonList = course.modules?.flatMap((module) =>
    (module.lessons || []).map((lesson) => ({
      ...lesson,
      moduleTitle: module.title,
    }))
  ) || [];
  const lessonIdSet = new Set(lessonList.map((lesson) => String(lesson.id)));
  const completedLessonIds = new Set(
    progress
      .filter((item) => item.completed && lessonIdSet.has(String(item.lesson_id)))
      .map((item) => String(item.lesson_id))
  );
  const completedLessons = completedLessonIds.size;
  const totalQuizzes = Object.keys(moduleQuizzes).length + (finalQuiz ? 1 : 0);
  const completedQuizzes = Object.values(moduleQuizzes).filter((quiz: any) => quizResponses[String(quiz.id)]).length
    + (finalQuiz && quizResponses[String(finalQuiz.id)] ? 1 : 0);
  const totalProgressItems = totalLessons + totalQuizzes;
  const completedProgressItems = completedLessons + completedQuizzes;
  const progressPercentage = totalProgressItems > 0
    ? Math.round((completedProgressItems / totalProgressItems) * 100)
    : 0;
  const selectedIndex = selectedLesson
    ? lessonList.findIndex((lesson) => String(lesson.id) === String(selectedLesson.id))
    : -1;
  const previousLesson = selectedIndex > 0 ? lessonList[selectedIndex - 1] : null;
  const nextLesson = selectedIndex >= 0 && selectedIndex < lessonList.length - 1
    ? lessonList[selectedIndex + 1]
    : null;

  const goToLesson = (lesson: Lesson | null) => {
    if (!lesson) return;
    setSelectedQuiz(null);
    setSelectedLesson(lesson);
  };

  const goToNextLesson = () => {
    if (!selectedLesson || !nextLesson) return;
    if (!isLessonCompleted(selectedLesson.id)) {
      toast.error('Conclua a aula atual antes de avançar.');
      return;
    }

    const currentModule = course.modules?.find((module) =>
      module.lessons?.some((lesson) => String(lesson.id) === String(selectedLesson.id))
    );
    const isLastLessonInModule = currentModule
      ? String(currentModule.lessons?.[currentModule.lessons.length - 1]?.id) === String(selectedLesson.id)
      : false;

    if (currentModule && isLastLessonInModule) {
      const moduleQuiz = moduleQuizzes[String(currentModule.id)];
      if (moduleQuiz && !quizResponses[String(moduleQuiz.id)]) {
        openQuiz(moduleQuiz);
        return;
      }
    }

    const isLastLessonOverall = String(lessonList[lessonList.length - 1]?.id) === String(selectedLesson.id);
    if (isLastLessonOverall && finalQuiz && !quizResponses[String(finalQuiz.id)]) {
      openQuiz(finalQuiz);
      return;
    }

    if (currentModule) {
      const moduleQuiz = moduleQuizzes[String(currentModule.id)];
      const isEnteringNewModule = currentModule.id !== nextLesson.module_id;
      if (moduleQuiz && isEnteringNewModule && !quizResponses[String(moduleQuiz.id)]) {
        toast.error('Conclua o questionário do módulo antes de avançar.');
        return;
      }
    }

    setSelectedLesson(nextLesson);
  };

  const goToPreviousLesson = () => {
    if (!previousLesson) return;
    setSelectedLesson(previousLesson);
  };

  const isModuleLessonsDone = (moduleId: string | number) => {
    const module = course.modules?.find((mod) => String(mod.id) === String(moduleId));
    if (!module?.lessons?.length) return false;
    return module.lessons.every((lesson) => isLessonCompleted(lesson.id));
  };

  const allModuleQuizzesPassed = Object.values(moduleQuizzes).every(
    (quiz: any) => quizResponses[String(quiz.id)]
  );
  const canAccessFinalQuiz = totalLessons > 0 && completedLessons === totalLessons && allModuleQuizzesPassed;
  const finalQuizPassed = finalQuiz ? quizResponses[String(finalQuiz.id)] : true;

  const openQuiz = (quiz: any) => {
    setSelectedLesson(null);
    setSelectedQuiz(quiz);
    setAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    if (!user || !selectedQuiz) return;
    const questions = selectedQuiz.questoes || [];
    if (!questions.length) {
      toast.error('Questionário sem questões.');
      return;
    }

    const total = questions.length;
    const correct = questions.reduce((sum: number, q: any) => {
      const answer = answers[String(q.id)];
      return sum + (answer && answer === q.correta ? 1 : 0);
    }, 0);
    const percentual = Math.round((correct / total) * 100);
    const aprovado = percentual >= minScore;

    setSubmittingQuiz(true);
    try {
      const { error } = await supabase
        .from('respostas_questionario')
        .upsert({
          questionario_id: selectedQuiz.id,
          usuario_id: user.id,
          acertos: correct,
          total,
          percentual,
          aprovado,
        }, { onConflict: 'questionario_id,usuario_id' });
      if (error) throw error;

      if (selectedQuiz.tipo === 'final') {
        const cursoId = selectedQuiz.curso_id || course?.id;
        if (!cursoId) {
          throw new Error('Curso nao encontrado para salvar resultado final.');
        }
        const { error: provaError } = await supabase
          .from('prova_resultado')
          .upsert({
            usuario_id: user.id,
            curso_id: cursoId,
            total_questoes: total,
            acertos: correct,
            percentual,
            aprovado,
          }, { onConflict: 'usuario_id,curso_id' });
        if (provaError) throw provaError;
      }
      setQuizResult({ percentual, aprovado });
      setQuizResponses((prev) => ({ ...prev, [String(selectedQuiz.id)]: aprovado }));
      toast.success(aprovado ? 'Prova aprovada!' : `Nota abaixo do mínimo (${minScore}%).`);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar prova.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const isCourseCompleted = totalLessons > 0
    && completedLessons === totalLessons
    && allModuleQuizzesPassed
    && finalQuizPassed;

  const videoData = selectedLesson?.video_url 
    ? getVideoData(selectedLesson.video_url)
    : null;

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
                {completedProgressItems} de {totalProgressItems} etapas concluídas
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <div className="card">
              {selectedQuiz ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    <FaPlay />
                    <span>{selectedQuiz.titulo}</span>
                  </div>
                  <h2 className="headline-font text-3xl mb-4">Questionário</h2>

                  {(selectedQuiz.questoes || []).map((questao: any, index: number) => (
                    <div key={questao.id} className="border border-[hsl(var(--border))] rounded-[12px] p-4 mb-4">
                      <p className="font-semibold mb-3">{index + 1}. {questao.enunciado}</p>
                      {(['a', 'b', 'c', 'd'] as const).map((key) => (
                        <label key={key} className="flex items-center gap-3 text-sm mb-2">
                          <input
                            type="radio"
                            name={`q-${questao.id}`}
                            value={key}
                            checked={answers[String(questao.id)] === key}
                            onChange={() => setAnswers((prev) => ({ ...prev, [String(questao.id)]: key }))}
                          />
                          <span>{questao[`alternativa_${key}`]}</span>
                        </label>
                      ))}
                    </div>
                  ))}

                  {quizResult ? (
                    <div className="mt-4 p-4 rounded-[12px] bg-[hsl(var(--muted))]">
                      <p className="font-semibold">
                        Resultado: {quizResult.percentual}% ({quizResult.aprovado ? 'Aprovado' : 'Reprovado'})
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={submitQuiz}
                      disabled={submittingQuiz}
                      className="btn-accent"
                    >
                      {submittingQuiz ? 'Enviando...' : 'Enviar respostas'}
                    </button>
                  )}
                </>
              ) : selectedLesson ? (
                <>
                  <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    <FaPlay />
                    <span>Aula em andamento</span>
                  </div>
                  <h2 className="headline-font text-3xl mb-4">{selectedLesson.title}</h2>

                  {videoData && (
                    <div className="aspect-video bg-[hsl(var(--foreground))] rounded-[12px] mb-6 overflow-hidden relative">
                      {activeVideoLessonId === selectedLesson.id ? (
                        <iframe
                          src={videoData.embedUrl}
                          title={selectedLesson.title || 'Video da aula'}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveVideoLessonId(selectedLesson.id)}
                          className="group relative w-full h-full"
                          aria-label={`Reproduzir ${selectedLesson.title}`}
                        >
                          {videoData.thumbnailUrl ? (
                            <img
                              src={videoData.thumbnailUrl}
                              alt={selectedLesson.title || 'Thumbnail da aula'}
                              loading="lazy"
                              decoding="async"
                              width={1280}
                              height={720}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--primary))] via-[hsl(var(--foreground))] to-[hsl(var(--accent))]" />
                          )}
                          <span className="absolute inset-0 bg-black/40 transition group-hover:bg-black/50" />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[hsl(var(--foreground))] text-2xl shadow-lg">
                              <FaPlay />
                            </span>
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {selectedLesson.content && (
                    <div className="prose max-w-none mb-6">
                      <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedLesson.content, { ADD_TAGS: ['iframe', 'video', 'source'], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height', 'style'] }) }} />
                    </div>
                  )}
                  {/* Imagens da Aula */}
                  {selectedLesson.image_urls && selectedLesson.image_urls.filter((url: string) => url).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3">Imagens da Aula</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedLesson.image_urls.filter((url: string) => url).map((url: string, index: number) => (
                          <a 
                            key={index} 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition"
                          >
                            <img 
                              src={url} 
                              alt={`Imagem ${index + 1} da aula`}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </a>
                        ))}
                      </div>
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
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Registre insights, referencias e proximos passos..."
                      className="input-field min-h-[140px]"
                    />
                    <div className="space-y-3">
                      <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                        Suas anotacoes desta aula
                      </p>
                      {notes.length === 0 ? (
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          Nenhuma anotacao salva ainda.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {notes.slice().reverse().map((item) => (
                            <div key={item.id} className="rounded-[12px] border border-[hsl(var(--border))] p-3">
                              <p className="text-sm whitespace-pre-line">{item.text}</p>
                              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                                {new Date(item.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div className="flex flex-wrap items-center gap-3">
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
                          Aula concluída
                        </button>
                      )}
                      <button
                        onClick={goToPreviousLesson}
                        className="btn-outline"
                        disabled={!previousLesson}
                      >
                        Aula anterior
                      </button>
                      <button
                        onClick={goToNextLesson}
                        className="btn-outline"
                        disabled={!nextLesson}
                      >
                        Próxima aula
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[hsl(var(--muted-foreground))]">Selecione uma aula para começar</p>
                </div>
              )}
            </div>

            {isCourseCompleted && (
              <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--primary))]">Certificado</p>
                  <p className="text-lg font-semibold">Seu curso esta completo</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Gere seu certificado e finalize esta etapa.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <button onClick={getCertificate} className="btn-accent flex items-center gap-2">
                    <FaCertificate />
                    Obter certificado
                  </button>
                  {course && (
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {course.price === 0 ? 'Certificado gratuito' : `Valor do certificado: R$ ${course.price.toFixed(2)}`}
                    </span>
                  )}
                </div>
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
                        onClick={() => goToLesson(lesson)}
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
                    {moduleQuizzes[String(module.id)] && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isModuleLessonsDone(module.id)) {
                            toast.error('Conclua todas as aulas do módulo para fazer o questionário.');
                            return;
                          }
                          openQuiz(moduleQuizzes[String(module.id)]);
                        }}
                        className="w-full text-left p-3 rounded-[12px] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                      >
                        {quizResponses[String(moduleQuizzes[String(module.id)].id)]
                          ? 'Questionário do módulo (concluído)'
                          : 'Questionário do módulo'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {finalQuiz && (
                <button
                  type="button"
                  onClick={() => {
                    if (!canAccessFinalQuiz) {
                      toast.error('Conclua todas as aulas para liberar a prova final.');
                      return;
                    }
                    openQuiz(finalQuiz);
                  }}
                  className="w-full text-left p-3 rounded-[12px] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
                >
                  {quizResponses[String(finalQuiz.id)] ? 'Prova final (concluída)' : 'Prova final'}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
