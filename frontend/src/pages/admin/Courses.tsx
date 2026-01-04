import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { FaTrash, FaEye, FaEyeSlash, FaSearch, FaArrowRight } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.map(normalizeCourse));
    } catch (error) {
      toast.error('Erro ao carregar cursos');
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/courses/${courseId}/publish`, { is_published: !currentStatus });
      toast.success(`Curso ${!currentStatus ? 'publicado' : 'despublicado'} com sucesso!`);
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar curso');
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) return;

    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Curso excluído com sucesso!');
      loadCourses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir curso');
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
          <div key={course.id} className="card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{course.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                      course.is_published
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]'
                        : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}
                  >
                    {course.is_published ? 'Publicado' : 'Em análise'}
                  </span>
                </div>
                <p className="text-[hsl(var(--muted-foreground))] mb-3">{course.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <span>Professor: {course.teacher_name || 'N/A'}</span>
                  <span>•</span>
                  <span>Preco: R$ {course.price.toFixed(2)}</span>
                  <span>•</span>
                  <span>{course.enrollment_count || 0} alunos</span>
                  <span>•</span>
                  <span>Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/courses/${course.id}`}
                  className="btn-outline flex items-center gap-2"
                >
                  <FaEye />
                  Visualizar
                </Link>
                <button
                  onClick={() => togglePublish(course.id, course.is_published)}
                  className="btn-accent flex items-center gap-2"
                >
                  {course.is_published ? <FaEyeSlash /> : <FaArrowRight />}
                  {course.is_published ? 'Recolher' : 'Aprovar'}
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="btn-outline flex items-center gap-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <FaTrash />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))]">Nenhum curso encontrado</p>
        </div>
      )}

      <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
        Total: {filteredCourses.length} curso(s)
      </div>
    </div>
  );
}
