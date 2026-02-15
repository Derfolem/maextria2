import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import { FaTrash, FaEye, FaEyeSlash, FaSearch, FaArrowRight, FaEdit, FaClock, FaTimes, FaFilter } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { trackContentPublished } from '../../lib/analytics';
import { stripHtml } from '../../lib/text';

type FilterOption = 'recentes' | 'modificados' | 'publicados' | 'reprovados' | 'aguardando' | 'curadoria' | 'rascunho' | 'az';

export default function AdminCourses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('recentes');
  const [feedbackOpen, setFeedbackOpen] = useState<string | number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data: coursesData, error } = await supabase
        .from('cursos')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) throw error;

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('matriculas')
        .select('curso_id');
      if (enrollmentsError) throw enrollmentsError;

      const enrollmentCounts = (enrollmentsData || []).reduce((acc: Record<string, number>, row) => {
        const key = String(row.curso_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const normalized = (coursesData || []).map((course) =>
        normalizeCourse({
          ...course,
          student_count: enrollmentCounts[String(course.id)] || 0,
        })
      );

      setCourses(normalized);
    } catch (error) {
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId: string | number, currentStatus: boolean) => {
    if (currentStatus) {
      const confirmed = confirm(
        'Tem certeza que deseja recolher? O aluno perdera todos os dados salvos e comecara tudo de novo.'
      );
      if (!confirmed) return;
    }

    try {
      const { error } = await supabase
        .from('cursos')
        .update({ ativo: !currentStatus })
        .eq('id', String(courseId));
      if (error) throw error;
      toast.success(`Curso ${!currentStatus ? 'publicado' : 'despublicado'} com sucesso!`);
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar curso');
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

  const reprovarCurso = async (courseId: string | number) => {
    if (!feedbackText.trim()) {
      toast.error('Escreva uma mensagem explicando o que precisa ser corrigido');
      return;
    }

    try {
      const { error } = await supabase
        .from('cursos')
        .update({
          em_curadoria: false,
          feedback_curadoria: feedbackText.trim()
        })
        .eq('id', String(courseId));
      if (error) throw error;
      toast.success('Curso reprovado. Feedback enviado ao professor.');
      setFeedbackOpen(null);
      setFeedbackText('');
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao reprovar curso');
    }
  };

  const aprovarCurso = async (courseId: string | number) => {
    try {
      const { error } = await supabase
        .from('cursos')
        .update({
          ativo: true,
          em_curadoria: false,
          feedback_curadoria: null
        })
        .eq('id', String(courseId));
      if (error) throw error;
      toast.success('Curso aprovado e publicado!');
      trackContentPublished('course', String(courseId));
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aprovar curso');
    }
  };

  const filteredAndSortedCourses = useMemo(() => {
    // Primeiro aplica busca por texto
    let result = courses.filter(
      (course) =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        stripHtml(course.description).toLowerCase().includes(search.toLowerCase()) ||
        course.teacher_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Aplicar filtro por status
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
      case 'rascunho':
        result = result.filter(c => !c.em_curadoria && !c.is_published);
        break;
      case 'aguardando':
        result = result.filter(c => !c.em_curadoria && !c.is_published);
        break;
    }

    // Aplicar ordenação
    switch (filter) {
      case 'recentes':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'modificados':
        result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'az':
        result.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
        break;
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [courses, search, filter]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Curadoria</p>
          <h1 className="headline-font text-4xl md:text-5xl">Aprovacao de cursos</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-3 max-w-xl">
            Revise, publique ou recuse cursos antes de liberar para o marketplace.
          </p>
        </div>
        <Link
          to="/admin/course/new-glass"
          className="btn-accent flex items-center gap-2 self-end"
        >
          <FaEdit /> Criar com Extrator
        </Link>
      </div>

      <div className="card mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-4 top-3 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por curso, professor ou tema..."
              className="input-field pl-12 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-[hsl(var(--muted-foreground))]" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterOption)}
              className="input-field py-2 pr-8"
            >
              <option value="recentes">Mais recentes</option>
              <option value="modificados">Modificados recentemente</option>
              <option value="publicados">Publicados</option>
              <option value="reprovados">Reprovados</option>
              <option value="curadoria">Em curadoria</option>
              <option value="rascunho">Rascunho</option>
              <option value="aguardando">Aguardando envio</option>
              <option value="az">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredAndSortedCourses.map((course) => (
          <div key={course.id} className={`card ${course.em_curadoria ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                      course.is_published
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]'
                        : course.em_curadoria
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {course.is_published ? 'Publicado' : course.em_curadoria ? 'Aguardando curadoria' : 'Rascunho'}
                  </span>
                  {course.versao && course.versao > 1 && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-medium">
                      v{course.versao}
                    </span>
                  )}
                  {course.curso_original_id && (
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                      Nova versao
                    </span>
                  )}
                </div>
                {(() => {
                  const plainDescription = stripHtml(course.description || '');
                  const isExpanded = expandedDescriptions[String(course.id)];
                  const previewLimit = 220;
                  const isLong = plainDescription.length > previewLimit;
                  const previewText = isLong ? `${plainDescription.slice(0, previewLimit)}...` : plainDescription;
                  return (
                    <div className="mb-3">
                      <p className="text-[hsl(var(--muted-foreground))]">
                        {isExpanded ? plainDescription : previewText}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDescriptions((prev) => ({
                              ...prev,
                              [String(course.id)]: !isExpanded,
                            }))
                          }
                          className="text-sm font-semibold text-[hsl(var(--primary))] hover:underline mt-1"
                        >
                          {isExpanded ? '... ler menos' : '... ver mais'}
                        </button>
                      )}
                    </div>
                  );
                })()}
                <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <span>Professor: {course.teacher_name || 'N/A'}</span>
                  <span>•</span>
                  {(course.duration_hours !== undefined && course.duration_hours !== null) && (
                    <span className="flex items-center gap-1">
                        <FaClock className="text-xs" />
                        {course.duration_hours}h
                    </span>
                  )}
                  <span>•</span>
                  <span>Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

                <div className="flex flex-wrap gap-2">
                {(() => {
                  const isOwnDraft = String(course.teacher_id) === String(user?.id) && !course.is_published;
                  return (
                    <>
                <Link
                  to={`/preview/course/${course.id}`}
                  className="btn-outline inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <FaEye />
                  Visualizar
                </Link>
                {(course.em_curadoria || isOwnDraft) ? (
                  <Link
                    to={`/teacher/course/${course.id}/edit`}
                    className="btn-outline inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaEdit />
                    Editar
                  </Link>
                ) : (
                  <button
                    disabled
                    className="btn-outline inline-flex items-center gap-2 whitespace-nowrap opacity-50 cursor-not-allowed"
                    title="Curso não está em curadoria"
                  >
                    <FaEdit />
                    Editar
                  </button>
                )}
                {course.is_published ? (
                  <button
                    onClick={() => togglePublish(course.id, course.is_published)}
                    className="btn-outline inline-flex items-center gap-2 whitespace-nowrap border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <FaEyeSlash />
                    Recolher
                  </button>
                ) : course.em_curadoria ? (
                  <>
                    <button
                      onClick={() => aprovarCurso(course.id)}
                      className="btn-accent inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <FaArrowRight />
                      Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setFeedbackOpen(feedbackOpen === course.id ? null : course.id);
                        setFeedbackText('');
                      }}
                      className="btn-outline inline-flex items-center gap-2 whitespace-nowrap border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                    <FaTimes />
                    Reprovar
                  </button>
                  </>
                ) : isOwnDraft ? (
                  <button
                    onClick={() => togglePublish(course.id, false)}
                    className="btn-accent inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <FaArrowRight />
                    Aprovar
                  </button>
                ) : (
                  <span className="text-sm text-[hsl(var(--muted-foreground))] px-3 py-2">
                    Aguardando envio
                  </span>
                )}
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="btn-outline inline-flex items-center gap-2 whitespace-nowrap border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <FaTrash />
                  Excluir
                </button>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Campo de feedback para reprovação */}
            {feedbackOpen === course.id && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  Mensagem de reprovação (obrigatório):
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Explique o que precisa ser corrigido no curso..."
                  className="w-full p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => reprovarCurso(course.id)}
                    disabled={!feedbackText.trim()}
                    className={`btn-outline border-red-400 text-red-500 hover:bg-red-500 hover:text-white ${
                      !feedbackText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Enviar reprovação
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackOpen(null);
                      setFeedbackText('');
                    }}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAndSortedCourses.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Nenhum curso encontrado</p>
          <Link to="/courses" className="btn-accent">
            Ir para a vitrine de cursos
          </Link>
        </div>
      )}

      <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
        Total: {filteredAndSortedCourses.length} curso(s)
      </div>
    </div>
  );
}
