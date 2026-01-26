import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaTrophy, FaUsers, FaCertificate, FaSearch, FaBook, FaChartBar } from 'react-icons/fa';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { normalizeCourse } from '../../lib/normalizeCourse';
import { Course } from '../../types';

interface CourseWithMetrics extends Course {
  enrollment_count: number;
  certificates_sold: number;
  search_count: number;
}

export default function TeacherPerformance() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithMetrics[]>([]);
  const [topSearched, setTopSearched] = useState<CourseWithMetrics[]>([]);
  const [topEnrolled, setTopEnrolled] = useState<CourseWithMetrics[]>([]);
  const [topCertificates, setTopCertificates] = useState<CourseWithMetrics[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadPerformanceData();
    }
  }, [user?.id]);

  const loadPerformanceData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Carregar cursos do professor
      const { data: cursosData, error: cursosError } = await supabase
        .from('cursos')
        .select(`
          *,
          matriculas(count),
          certificados_vendidos:certificados(count)
        `)
        .eq('professor_id', user.id);

      if (cursosError) throw cursosError;

      const normalizedCourses: CourseWithMetrics[] = (cursosData || []).map((c: any) => ({
        ...normalizeCourse(c),
        enrollment_count: c.matriculas?.[0]?.count || 0,
        certificates_sold: c.certificados_vendidos?.[0]?.count || 0,
        search_count: c.visualizacoes || 0,
      }));

      setCourses(normalizedCourses);

      // Top 5 mais procurados (por visualizações/buscas)
      const sortedBySearch = [...normalizedCourses]
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 5);
      setTopSearched(sortedBySearch);

      // Top 5 mais matriculados
      const sortedByEnrollment = [...normalizedCourses]
        .sort((a, b) => b.enrollment_count - a.enrollment_count)
        .slice(0, 5);
      setTopEnrolled(sortedByEnrollment);

      // Top 5 mais certificados vendidos
      const sortedByCertificates = [...normalizedCourses]
        .sort((a, b) => b.certificates_sold - a.certificates_sold)
        .slice(0, 5);
      setTopCertificates(sortedByCertificates);

    } catch (error) {
      console.error('Erro ao carregar desempenho:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    icon, 
    courses, 
    metricKey, 
    color 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    courses: CourseWithMetrics[]; 
    metricKey: 'search_count' | 'enrollment_count' | 'certificates_sold';
    color: string;
  }) => (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`text-2xl ${color}`}>{icon}</div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {courses.length === 0 ? (
        <p className="text-[hsl(var(--muted-foreground))] text-sm">Sem dados ainda</p>
      ) : (
        <div className="space-y-3">
          {courses.map((course, index) => (
            <div 
              key={course.id} 
              className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))/0.2] border border-[hsl(var(--border))]"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' : 
                  index === 1 ? 'bg-gray-400 text-black' : 
                  index === 2 ? 'bg-orange-600 text-white' : 
                  'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                }`}>
                  {index + 1}
                </span>
                <span className="font-medium text-sm truncate max-w-[180px]">{course.title}</span>
              </div>
              <span className={`font-bold ${color}`}>
                {course[metricKey]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <p className="text-[hsl(var(--muted-foreground))]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-8 px-[clamp(16px,4vw,48px)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/teacher/dashboard" 
            className="inline-flex items-center gap-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-4 transition"
          >
            <FaArrowLeft />
            <span>Voltar ao Painel</span>
          </Link>
          <h1 className="headline-font text-3xl md:text-4xl mb-2">Desempenho dos Cursos</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Acompanhe as métricas e o desempenho de todos os seus cursos.
          </p>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <FaBook className="text-3xl text-[hsl(var(--primary))] mx-auto mb-2" />
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total de Cursos</p>
          </div>
          <div className="card text-center">
            <FaUsers className="text-3xl text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.enrollment_count, 0)}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Total de Alunos</p>
          </div>
          <div className="card text-center">
            <FaCertificate className="text-3xl text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.certificates_sold, 0)}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Certificados</p>
          </div>
          <div className="card text-center">
            <FaSearch className="text-3xl text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {courses.reduce((sum, c) => sum + c.search_count, 0)}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Visualizações</p>
          </div>
        </div>

        {/* Top 5 Rankings */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MetricCard 
            title="Top 5 Mais Procurados" 
            icon={<FaSearch />} 
            courses={topSearched}
            metricKey="search_count"
            color="text-purple-500"
          />
          <MetricCard 
            title="Top 5 Mais Matriculados" 
            icon={<FaUsers />} 
            courses={topEnrolled}
            metricKey="enrollment_count"
            color="text-blue-500"
          />
          <MetricCard 
            title="Top 5 Certificados" 
            icon={<FaCertificate />} 
            courses={topCertificates}
            metricKey="certificates_sold"
            color="text-green-500"
          />
        </div>

        {/* Todos os Cursos */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FaChartBar className="text-2xl text-[hsl(var(--primary))]" />
            <h2 className="text-xl font-semibold">Todos os Cursos</h2>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">Você ainda não criou nenhum curso</p>
              <Link to="/teacher/course/new" className="btn-primary">
                Criar primeiro curso
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left py-3 px-4 font-semibold">Curso</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-center py-3 px-4 font-semibold">Alunos</th>
                    <th className="text-center py-3 px-4 font-semibold">Certificados</th>
                    <th className="text-center py-3 px-4 font-semibold">Visualizações</th>
                    <th className="text-center py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))/0.2]">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {course.thumbnail && (
                            <img 
                              src={course.thumbnail} 
                              alt={course.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                          )}
                          <span className="font-medium">{course.title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          course.is_published 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {course.is_published ? 'Publicado' : 'Em análise'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-blue-500">
                        {course.enrollment_count}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-green-500">
                        {course.certificates_sold}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-purple-500">
                        {course.search_count}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Link 
                          to={`/teacher/course/${course.id}/edit`}
                          className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))] text-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
