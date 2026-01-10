import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../../types';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

export default function TeacherMyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadCourses();
  }, [user?.id, user?.role]);

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
        .from('cursos')
        .delete()
        .eq('id', String(courseId));
      if (error) throw error;
      toast.success('Curso excluído com sucesso!');
      loadCourses();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir curso');
    }
  };

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
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Cursos</p>
          <h1 className="headline-font text-4xl md:text-5xl">Seu catálogo</h1>
        </div>
        <Link to="/teacher/course/new" className="btn-accent flex items-center space-x-2">
          <FaPlus />
          <span>Novo curso</span>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[hsl(var(--muted-foreground))] mb-4">Você ainda não criou nenhum curso</p>
          <Link to="/teacher/course/new" className="btn-accent">
            Criar primeiro curso
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div key={course.id} className="card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-grow mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold">{course.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] ${
                      course.is_published
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]'
                        : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {course.is_published ? 'Publicado' : 'Em análise'}
                    </span>
                  </div>
                  <p className="text-[hsl(var(--muted-foreground))] mb-3">{course.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-[hsl(var(--muted-foreground))]">
                    <span>•</span>
                    <span>{course.enrollment_count || 0} alunos</span>
                    <span>•</span>
                    <span>Criado em {new Date(course.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/teacher/course/${course.id}/edit`}
                    className="btn-outline flex items-center space-x-1"
                  >
                    <FaEdit />
                    <span>Editar</span>
                  </Link>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="btn-outline flex items-center space-x-1 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <FaTrash />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
