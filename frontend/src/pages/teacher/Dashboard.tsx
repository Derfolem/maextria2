import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, Course } from '../../types';
import { FaBook, FaUsers, FaDollarSign, FaChartLine, FaPlus, FaArrowRight, FaUniversity } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeCourse } from '../../lib/normalizeCourse';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const user = useAuthStore((state) => state.user);
  const [bankForm, setBankForm] = useState({
    holder: '',
    document: '',
    bank: '',
    agency: '',
    account: '',
    accountType: '',
  });

  useEffect(() => {
    loadDashboard();
  }, [user?.id, user?.role]);

  const resolveCourseOwnerId = (course: Record<string, any>) =>
    course.professor_id ?? course.teacher_id ?? course.autor_id ?? course.criado_por ?? course.user_id;

  const loadDashboard = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('cursos')
        .select('*')
        .order('criado_em', { ascending: false });
      if (coursesError) throw coursesError;

      const allCourses = coursesData || [];
      const shouldFilter = user?.role === 'teacher' && user?.id;
      const filteredCourses = shouldFilter
        ? allCourses.filter((course) => String(resolveCourseOwnerId(course)) === String(user?.id))
        : allCourses;

      const courseIds = filteredCourses.map((course) => course.id);
      let enrollmentsData: Array<{ curso_id: string; usuario_id: string }> = [];
      let paymentsData: Array<{ valor: number; criado_em: string; curso_id: string }> = [];

      if (courseIds.length > 0) {
        const [enrollmentsRes, paymentsRes] = await Promise.all([
          supabase
            .from('matriculas')
            .select('curso_id, usuario_id')
            .in('curso_id', courseIds),
          supabase
            .from('transacoes_pagamento')
            .select('valor, criado_em, curso_id')
            .eq('status', 'completo')
            .in('curso_id', courseIds),
        ]);
        if (enrollmentsRes.error) throw enrollmentsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        enrollmentsData = enrollmentsRes.data || [];
        paymentsData = paymentsRes.data || [];
      }

      const enrollmentCounts = enrollmentsData.reduce((acc: Record<string, number>, row) => {
        const key = String(row.curso_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const uniqueStudents = new Set(enrollmentsData.map((row) => row.usuario_id)).size;
      const totalRevenue = paymentsData.reduce((sum, row) => sum + Number(row.valor || 0), 0);

      const revenueByMonth = paymentsData.reduce((acc: Record<string, { label: string; value: number }>, row) => {
        const date = row.criado_em ? new Date(row.criado_em) : null;
        if (!date) return acc;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc[key] = acc[key] || { label, value: 0 };
        acc[key].value += Number(row.valor || 0);
        return acc;
      }, {});

      const sortedMonths = Object.keys(revenueByMonth).sort();

      setStats({
        total_courses: filteredCourses.length,
        active_students: uniqueStudents,
        total_revenue: totalRevenue,
        total_enrollments: enrollmentsData.length,
      });

      setRevenueData(
        sortedMonths.map((month) => ({
          month: revenueByMonth[month].label,
          revenue: revenueByMonth[month].value,
        }))
      );

      setCourses(
        filteredCourses.map((course) =>
          normalizeCourse({
            ...course,
            student_count: enrollmentCounts[String(course.id)] || 0,
          })
        )
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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

  const handleBankChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setBankForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast.success('Dados financeiros registrados. Envio real sera configurado na producao.');
  };

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Painel do professor</p>
          <h1 className="headline-font text-4xl md:text-5xl">Gestao com criterio</h1>
        </div>
        <Link to="/teacher/course/new" className="btn-accent inline-flex items-center gap-2">
          <FaPlus />
          Novo curso
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: 'Cursos ativos',
            value: stats.total_courses || 0,
            icon: <FaBook />,
          },
          {
            label: 'Alunos ativos',
            value: stats.active_students || 0,
            icon: <FaUsers />,
          },
          {
            label: 'Receita total',
            value: `R$ ${(stats.total_revenue || 0).toFixed(2)}`,
            icon: <FaDollarSign />,
          },
          {
            label: 'Matriculas',
            value: stats.total_enrollments || 0,
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
          <h2 className="text-xl font-semibold mb-4">Receita mensal</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Cursos mais populares</h2>
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-[12px]">
                <div>
                  <p className="font-semibold">{course.title}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {course.enrollment_count || 0} alunos
                  </p>
                </div>
                <Link
                  to={`/teacher/course/${course.id}/edit`}
                  className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mb-12">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Meus cursos</h2>
            <Link to="/teacher/my-courses" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
              Ver todos
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[hsl(var(--muted-foreground))] mb-4">Você ainda nao criou nenhum curso</p>
              <Link to="/teacher/course/new" className="btn-accent">
                Criar primeiro curso
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="border border-[hsl(var(--border))] rounded-[12px] p-4 hover:shadow-md transition">
                  <h3 className="font-semibold mb-2">{course.title}</h3>
                  <p className="text-[hsl(var(--muted-foreground))] text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      course.is_published ? 'bg-[hsl(var(--muted))] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {course.is_published ? 'Publicado' : 'Em análise'}
                    </span>
                    <Link
                      to={`/teacher/course/${course.id}/edit`}
                      className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
              <FaUniversity />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Dados bancarios</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Necessarios para repasse</p>
            </div>
          </div>
          <form onSubmit={handleBankSubmit} className="space-y-4">
            <input
              name="holder"
              value={bankForm.holder}
              onChange={handleBankChange}
              placeholder="Nome completo do titular"
              className="input-field"
              required
            />
            <input
              name="document"
              value={bankForm.document}
              onChange={handleBankChange}
              placeholder="CPF ou CNPJ"
              className="input-field"
              required
            />
            <input
              name="bank"
              value={bankForm.bank}
              onChange={handleBankChange}
              placeholder="Banco"
              className="input-field"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="agency"
                value={bankForm.agency}
                onChange={handleBankChange}
                placeholder="Agencia"
                className="input-field"
                required
              />
              <input
                name="account"
                value={bankForm.account}
                onChange={handleBankChange}
                placeholder="Conta"
                className="input-field"
                required
              />
            </div>
            <input
              name="accountType"
              value={bankForm.accountType}
              onChange={handleBankChange}
              placeholder="Tipo de conta (corrente, poupanca)"
              className="input-field"
              required
            />
            <button type="submit" className="btn-accent inline-flex items-center gap-2">
              Salvar dados
              <FaArrowRight />
            </button>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Os dados serao enviados para validacao quando a integracao estiver ativa.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
