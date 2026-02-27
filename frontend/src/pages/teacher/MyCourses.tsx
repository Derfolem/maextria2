import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Course, Trilha } from '../../types';
import toast from 'react-hot-toast';
import { FaEye, FaPlus, FaEdit, FaTrash, FaCopy, FaPaperPlane, FaExclamationTriangle, FaClock, FaFilter, FaRoute, FaShareAlt } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import TrilhaModal from '../../components/TrilhaModal';
import ShareModal from '../../components/ShareModal';
import { stripHtml } from '../../lib/text';

type FilterOption = 'recentes' | 'editados' | 'modificados' | 'publicados' | 'reprovados' | 'curadoria' | 'trilhas' | 'az';

export default function TeacherMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>('recentes');
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [trilhaModal, setTrilhaModal] = useState(false);
  const [editingTrilha, setEditingTrilha] = useState<Trilha | null>(null);
  const [cursosTrilhaMap, setCursosTrilhaMap] = useState<Record<string, string[]>>({});
  const [shareModalCourse, setShareModalCourse] = useState<Course | null>(null);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const getCourseTimestamp = (course: Course, field: 'created_at' | 'updated_at') => {
    const primary = new Date(course[field] as any).getTime();
    if (Number.isFinite(primary)) return primary;
    const fallback = new Date(course.created_at as any).getTime();
    return Number.isFinite(fallback) ? fallback : 0;
  };
  const formatDateTime = (value: string | number) => {
    const date = new Date(value as any);
    if (!Number.isFinite(date.getTime())) return '-';
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const filteredAndSortedCourses = useMemo(() => {
    let result = [...courses];

    // Aplicar filtro
    switch (filter) {
      case 'publicados':
        result = result.filter(c => c.is_published);
        break;
      case 'reprovados':
        result = result.filter(c => c.feedback_curadoria);
        break;
      case 'curadoria':
        result = result.filter(c => c.em_curadoria);
        break;
      case 'trilhas':
        // Mostrar apenas cursos que estao em alguma trilha
        result = result.filter(c => cursosTrilhaMap[String(c.id)]?.length > 0);
        break;
    }

    // Aplicar ordenacao
    switch (filter) {
      case 'recentes':
        result.sort((a, b) => getCourseTimestamp(b, 'created_at') - getCourseTimestamp(a, 'created_at'));
        break;
      case 'editados':
      case 'modificados':
        result.sort((a, b) => getCourseTimestamp(b, 'updated_at') - getCourseTimestamp(a, 'updated_at'));
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        result.sort((a, b) => getCourseTimestamp(b, 'created_at') - getCourseTimestamp(a, 'created_at'));
    }

    return result;
  }, [courses, filter, cursosTrilhaMap]);

  useEffect(() => {
    loadCourses();
    loadTrilhas();
  }, [user?.id, user?.role]);

  const loadTrilhas = async () => {
    if (!user?.id) return;

    try {
      const { data: trilhasData, error } = await supabase
        .from('trilhas')
        .select(`
          *,
          trilha_cursos(*)
        `)
        .eq('professor_id', user.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const trilhasNormalizadas = (trilhasData || []).map(t => ({
        ...t,
        cursos: t.trilha_cursos || [],
      }));

      setTrilhas(trilhasNormalizadas);

      // Criar mapa de curso -> trilhas (um curso pode estar em multiplas trilhas)
      const map: Record<string, string[]> = {};
      trilhasNormalizadas.forEach(trilha => {
        trilha.cursos?.forEach((tc: any) => {
          if (!map[tc.curso_id]) {
            map[tc.curso_id] = [];
          }
          map[tc.curso_id].push(trilha.nome);
        });
      });
      setCursosTrilhaMap(map);
    } catch (error) {
      console.error('Erro ao carregar trilhas:', error);
    }
  };

  const resolveCourseOwnerId = (course: Record<string, any>) =>
    course.professor_id ?? course.teacher_id ?? course.autor_id ?? course.criado_por ?? course.user_id;

  const loadCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('cursos')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;

      const allCourses = coursesData || [];
      const shouldFilter = user?.role === 'teacher' && user?.id;
      const filteredCourses = shouldFilter
        ? allCourses.filter((course) => String(resolveCourseOwnerId(course)) === String(user?.id))
        : allCourses;

      const courseIds = filteredCourses.map((course) => course.id);
      let enrollmentsData: Array<{ curso_id: string }> = [];
      if (courseIds.length > 0) {
        const { data, error: enrollmentsError } = await supabase
          .from('matriculas')
          .select('curso_id')
          .in('curso_id', courseIds);
        if (enrollmentsError) throw enrollmentsError;
        enrollmentsData = data || [];
      }

      const enrollmentCounts = enrollmentsData.reduce((acc: Record<string, number>, row) => {
        const key = String(row.curso_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      setCourses(
        filteredCourses.map((course) =>
          normalizeCourse({
            ...course,
            student_count: enrollmentCounts[String(course.id)] || 0,
          })
        )
      );
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId: string | number) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;

    try {
      const { error } = await supabase
        .rpc('delete_course_full', { curso_id: String(courseId) });
      if (error) throw error;
      toast.success('Curso excluído com sucesso!');
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir curso');
    }
  };

  const toggleCuradoria = async (courseId: string | number, currentStatus: boolean) => {
    if (currentStatus) return; // Não pode desativar curadoria manualmente

    if (!confirm('Deseja enviar este curso para curadoria? Você não poderá editar enquanto estiver em análise.')) return;

    try {
      const { error } = await supabase
        .from('cursos')
        .update({
          em_curadoria: true,
          feedback_curadoria: null // Limpa feedback anterior ao reenviar
        })
        .eq('id', String(courseId));
      if (error) throw error;
      toast.success('Curso enviado para curadoria!');
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar para curadoria');
    }
  };

  const duplicateCourse = async (courseId: string | number) => {
    if (!confirm('Deseja duplicar este curso?')) return;

    const toastId = toast.loading('Duplicando curso...');

    try {
      // 1. Buscar curso original
      const { data: originalCourse, error: courseError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();
      if (courseError || !originalCourse) throw courseError || new Error('Curso não encontrado');

      // 2. Criar cópia do curso
      const { id: _id, criado_em: _criado, atualizado_em: _atualizado, slug: _slug, ...courseData } = originalCourse;
      const timestamp = Date.now();
      const newSlug = originalCourse.slug ? `${originalCourse.slug}-copia-${timestamp}` : `curso-copia-${timestamp}`;
      const { data: newCourse, error: newCourseError } = await supabase
        .from('cursos')
        .insert({
          ...courseData,
          titulo: `Cópia de ${originalCourse.titulo}`,
          slug: newSlug,
          ativo: false,
          professor_id: user?.id,
        })
        .select()
        .single();
      if (newCourseError || !newCourse) throw newCourseError || new Error('Erro ao criar curso');

      // 3. Buscar e duplicar módulos
      const { data: modulos } = await supabase
        .from('modulos')
        .select('*')
        .eq('curso_id', courseId)
        .order('ordem');

      const moduloIdMap: Record<string, string> = {};

      if (modulos && modulos.length > 0) {
        for (const modulo of modulos) {
          const { id: oldModuloId, criado_em: _mc, ...moduloData } = modulo;
          const { data: newModulo } = await supabase
            .from('modulos')
            .insert({ ...moduloData, curso_id: newCourse.id })
            .select()
            .single();
          if (newModulo) {
            moduloIdMap[oldModuloId] = newModulo.id;
          }
        }

        // 4. Buscar e duplicar aulas
        const oldModuloIds = Object.keys(moduloIdMap);
        const { data: aulas } = await supabase
          .from('aulas')
          .select('*')
          .in('modulo_id', oldModuloIds)
          .order('ordem');

        if (aulas && aulas.length > 0) {
          for (const aula of aulas) {
            const { id: _aulaId, criado_em: _ac, ...aulaData } = aula;
            await supabase
              .from('aulas')
              .insert({ ...aulaData, modulo_id: moduloIdMap[aula.modulo_id] });
          }
        }

        // 5. Buscar e duplicar questionários e questões
        const { data: questionarios } = await supabase
          .from('questionarios')
          .select('*')
          .eq('curso_id', courseId);

        if (questionarios && questionarios.length > 0) {
          for (const quiz of questionarios) {
            const { id: oldQuizId, criado_em: _qc, ...quizData } = quiz;
            const newModuloId = quiz.modulo_id ? moduloIdMap[quiz.modulo_id] : null;
            const { data: newQuiz } = await supabase
              .from('questionarios')
              .insert({ ...quizData, curso_id: newCourse.id, modulo_id: newModuloId })
              .select()
              .single();

            if (newQuiz) {
              const { data: questoes } = await supabase
                .from('questoes')
                .select('*')
                .eq('questionario_id', oldQuizId);

              if (questoes && questoes.length > 0) {
                for (const questao of questoes) {
                  const { id: _qid, ...questaoData } = questao;
                  await supabase
                    .from('questoes')
                    .insert({ ...questaoData, questionario_id: newQuiz.id });
                }
              }
            }
          }
        }
      }

      toast.success('Curso duplicado com sucesso!', { id: toastId });
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao duplicar curso', { id: toastId });
    }
  };

  const handleEditCourse = async (course: Course) => {
    // Se em curadoria, não pode editar
    if (course.em_curadoria) {
      toast.error('Curso em curadoria - aguarde análise do admin');
      return;
    }

    try {
      // Verificar se precisa clonar (curso publicado com alunos)
      const { data: shouldClone, error: checkError } = await supabase.rpc('should_clone_for_editing', {
        p_curso_id: String(course.id)
      });

      if (checkError) {
        console.error('Erro ao verificar clone:', checkError);
        // Se a função não existe ainda, edita normalmente
        navigate(`/teacher/course/${course.id}/edit`);
        return;
      }

      if (shouldClone) {
        // Verificar se já existe um clone pendente
        const { data: pendingClone } = await supabase.rpc('get_pending_clone', {
          p_original_id: String(course.id)
        });

        if (pendingClone) {
          // Redirecionar para o clone existente
          toast.success('Redirecionando para versão em edição...');
          navigate(`/teacher/course/${pendingClone}/edit`);
          return;
        }

        // Confirmar criação de nova versão
        if (!confirm('Este curso está publicado com alunos matriculados.\n\nSerá criada uma nova versão para edição. Os alunos atuais continuarão na versão antiga.\n\nContinuar?')) {
          return;
        }

        const toastId = toast.loading('Criando nova versão...');
        try {
          const { data: newCourseId, error: cloneError } = await supabase.rpc('clone_course_for_editing', {
            p_original_curso_id: String(course.id)
          });

          if (cloneError) throw cloneError;

          toast.success('Nova versão criada! Redirecionando...', { id: toastId });
          loadCourses();
          navigate(`/teacher/course/${newCourseId}/edit`);
        } catch (error: any) {
          toast.error(error?.message || 'Erro ao criar nova versão', { id: toastId });
        }
      } else {
        // Comportamento normal - edita diretamente
        navigate(`/teacher/course/${course.id}/edit`);
      }
    } catch (error: any) {
      console.error('Erro ao verificar edição:', error);
      // Em caso de erro, tenta editar normalmente
      navigate(`/teacher/course/${course.id}/edit`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold gradient-text">Meus Cursos</h1>
          <Link to="/teacher/course/new-glass" className="btn-primary flex items-center gap-2">
            <FaPlus /> Novo Curso
          </Link>
        </div>
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
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Cursos</p>
          <h1 className="headline-font text-4xl md:text-5xl">Seu catálogo</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FaFilter className="text-[hsl(var(--muted-foreground))]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="input-field py-2 pr-8 text-[hsl(var(--member-strong))]"
            >
              <option value="recentes">Mais recentes</option>
              <option value="editados">Editado recente</option>
              <option value="publicados">Publicados</option>
              <option value="reprovados">Reprovados</option>
              <option value="curadoria">Em curadoria</option>
              <option value="trilhas">Em trilhas</option>
              <option value="az">A-Z</option>
            </select>
          </div>
          <button
            onClick={() => {
              setEditingTrilha(null);
              setTrilhaModal(true);
            }}
            disabled={trilhas.length >= 3}
            className="btn-outline flex items-center space-x-2"
            title={trilhas.length >= 3 ? 'Limite de 3 trilhas atingido' : 'Montar trilha'}
          >
            <FaRoute />
            <span>Montar Trilha</span>
          </button>
          <Link to="/teacher/course/new-glass" className="btn-accent flex items-center space-x-2">
            <FaPlus />
            <span>Novo curso</span>
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Você ainda não criou nenhum curso</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/teacher/course/new-glass" className="btn-accent">
              Criar primeiro curso
            </Link>
            <Link to="/courses" className="btn-outline">
              Ir para a vitrine de cursos
            </Link>
          </div>
        </div>
      ) : filteredAndSortedCourses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Nenhum curso encontrado com este filtro</p>
          <button onClick={() => setFilter('recentes')} className="btn-outline">
            Limpar filtro
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedCourses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-grow mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                      course.is_published
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]'
                        : course.em_curadoria
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {course.is_published ? 'Publicado' : course.em_curadoria ? 'Em curadoria' : 'Rascunho'}
                    </span>
                    {course.versao && course.versao > 1 && (
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                        v{course.versao}
                      </span>
                    )}
                    {course.curso_original_id && !course.is_published && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                        Nova versao em edicao
                      </span>
                    )}
                    {cursosTrilhaMap[String(course.id)]?.map((trilhaNome, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-orange-500 text-white text-xs font-medium"
                      >
                        {trilhaNome}
                      </span>
                    ))}
                  </div>
                  <p className="text-[hsl(var(--muted-foreground))] mb-3">{stripHtml(course.description)}</p>
                  <div className="flex items-center space-x-4 text-sm text-[hsl(var(--muted-foreground))]">
                    <span>•</span>
                    {(course.duration_hours !== undefined && course.duration_hours !== null) && (
                      <span className="flex items-center gap-1">
                          <FaClock />
                          {course.duration_hours}h
                      </span>
                    )}
                    <span>•</span>
                    <span>Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                    <span>•</span>
                    <span>Editado em {formatDateTime(course.updated_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/preview/course/${course.id}`}
                    className="btn-outline flex items-center space-x-1"
                  >
                    <FaEye />
                    <span>Visualizar</span>
                  </Link>
                  <button
                    onClick={() => handleEditCourse(course)}
                    disabled={course.em_curadoria}
                    className={`btn-outline flex items-center space-x-1 ${course.em_curadoria ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={course.em_curadoria ? 'Curso em curadoria - aguarde análise do admin' : 'Editar curso'}
                  >
                    <FaEdit />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => duplicateCourse(course.id)}
                    className="btn-outline flex items-center space-x-1"
                  >
                    <FaCopy />
                    <span>Duplicar</span>
                  </button>
                  {course.is_published && (
                    <button
                      onClick={() => setShareModalCourse(course)}
                      className="btn-outline flex items-center space-x-1 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))] hover:text-white"
                      title="Compartilhar nas redes sociais"
                    >
                      <FaShareAlt />
                      <span>Compartilhar</span>
                    </button>
                  )}
                  {!course.is_published && !course.em_curadoria && (
                    <button
                      onClick={() => toggleCuradoria(course.id, course.em_curadoria || false)}
                      className="btn-accent flex items-center space-x-1"
                      title="Enviar para análise do admin"
                    >
                      <FaPaperPlane />
                      <span>Enviar para curadoria</span>
                    </button>
                  )}
                  {!course.is_published && !course.em_curadoria && (
                    <button
                      onClick={() => deleteCourse(course.id)}
                      className="btn-outline flex items-center space-x-1 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <FaTrash />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback de reprovação do admin */}
              {course.feedback_curadoria && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700 mb-1">Feedback do Admin:</p>
                      <p className="text-sm text-red-600">{course.feedback_curadoria}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Secao de Trilhas */}
      {trilhas.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Organizacao</p>
              <h2 className="headline-font text-2xl md:text-3xl">Suas Trilhas ({trilhas.length}/3)</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trilhas.map((trilha) => (
              <div key={trilha.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg">{trilha.nome}</h3>
                  <button
                    onClick={() => {
                      setEditingTrilha(trilha);
                      setTrilhaModal(true);
                    }}
                    className="p-2 rounded hover:bg-[hsl(var(--muted))] transition"
                    title="Editar trilha"
                  >
                    <FaEdit className="text-[hsl(var(--muted-foreground))]" />
                  </button>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                  {trilha.cursos?.length || 0} curso(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {trilha.cursos?.slice(0, 3).map((tc) => {
                    const curso = courses.find(c => String(c.id) === tc.curso_id);
                    return (
                      <span
                        key={tc.id}
                        className="px-2 py-1 text-xs bg-[hsl(var(--muted))] rounded truncate max-w-[120px]"
                        title={curso?.title}
                      >
                        {curso?.title || 'Curso'}
                      </span>
                    );
                  })}
                  {(trilha.cursos?.length || 0) > 3 && (
                    <span className="px-2 py-1 text-xs bg-[hsl(var(--muted))] rounded">
                      +{(trilha.cursos?.length || 0) - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Trilha */}
      <TrilhaModal
        isOpen={trilhaModal}
        onClose={() => {
          setTrilhaModal(false);
          setEditingTrilha(null);
        }}
        onSave={loadTrilhas}
        courses={courses}
        trilha={editingTrilha}
        professorId={String(user?.id || '')}
      />

      {shareModalCourse && (
        <ShareModal
          course={shareModalCourse}
          onClose={() => setShareModalCourse(null)}
        />
      )}
    </div>
  );
}
