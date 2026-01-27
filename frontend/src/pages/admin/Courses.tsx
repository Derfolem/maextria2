import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaTrash, FaEye, FaEyeSlash, FaSearch, FaArrowRight, FaEdit, FaClock, FaTimes } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState<string | number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

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
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao aprovar curso');
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

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
      </div>

      <div className="card mb-8">
        <div className="relative">
          <FaSearch className="absolute left-4 top-3 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por curso, professor ou tema..."
            className="input-field pl-12 w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCourses.map((course) => (
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
                </div>
                <p className="text-[hsl(var(--muted-foreground))] mb-3">{course.description}</p>
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
                <Link
                  to={`/preview/course/${course.id}`}
                  className="btn-outline flex items-center gap-2"
                >
                  <FaEye />
                  Visualizar
                </Link>
                {course.em_curadoria ? (
                  <Link
                    to={`/teacher/course/${course.id}/edit`}
                    className="btn-outline flex items-center gap-2"
                  >
                    <FaEdit />
                    Editar
                  </Link>
                ) : (
                  <button
                    disabled
                    className="btn-outline flex items-center gap-2 opacity-50 cursor-not-allowed"
                    title="Curso não está em curadoria"
                  >
                    <FaEdit />
                    Editar
                  </button>
                )}
                {course.is_published ? (
                  <button
                    onClick={() => togglePublish(course.id, course.is_published)}
                    className="btn-outline flex items-center gap-2 border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white"
                  >
                    <FaEyeSlash />
                    Recolher
                  </button>
                ) : course.em_curadoria ? (
                  <>
                    <button
                      onClick={() => aprovarCurso(course.id)}
                      className="btn-accent flex items-center gap-2"
                    >
                      <FaArrowRight />
                      Aprovar
                    </button>
                    <button
                      onClick={() => {
                        setFeedbackOpen(feedbackOpen === course.id ? null : course.id);
                        setFeedbackText('');
                      }}
                      className="btn-outline flex items-center gap-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <FaTimes />
                      Reprovar
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-[hsl(var(--muted-foreground))] px-3 py-2">
                    Aguardando envio
                  </span>
                )}
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="btn-outline flex items-center gap-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <FaTrash />
                  Excluir
                </button>
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

      {filteredCourses.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Nenhum curso encontrado</p>
          <Link to="/courses" className="btn-accent">
            Ir para a vitrine de cursos
          </Link>
        </div>
      )}

      <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
        Total: {filteredCourses.length} curso(s)
      </div>
    </div>
  );
}
