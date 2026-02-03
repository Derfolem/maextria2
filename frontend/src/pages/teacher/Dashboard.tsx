import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats, Course } from '../../types';
import { FaBook, FaUsers, FaDollarSign, FaChartLine, FaPlus, FaArrowRight, FaUniversity } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { normalizeCourse } from '../../lib/normalizeCourse';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ThemeToggle';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

export default function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [revenueByCourse, setRevenueByCourse] = useState<Array<{ name: string; revenue: number }>>([]);
  const [financeSnapshot, setFinanceSnapshot] = useState({
    totalRevenue: 0,
    revenue30d: 0,
    totalPayments: 0,
    avgTicket: 0,
    monthGrowth: null as number | null,
  });
  const user = useAuthStore((state) => state.user);
  const [bankForm, setBankForm] = useState({
    holder: '',
    document: '',
    bank: '',
    agency: '',
    account: '',
    accountType: '',
    pixKey: '',
  });
  const [bankSaving, setBankSaving] = useState(false);
  const [comissoesPendentes, setComissoesPendentes] = useState({ total: 0, valor: 0 });
  const [comissoesRecentes, setComissoesRecentes] = useState<Array<{
    id: string;
    curso_titulo: string;
    valor_venda: number;
    percentual: number;
    valor_comissao: number;
    status: 'OPEN' | 'PAID' | 'REVERSED';
    data: string;
  }>>([]);

  useEffect(() => {
    loadDashboard();
    if (user?.id) {
      loadBankData();
      loadComissoesPendentes();
    }
  }, [user?.id, user?.role]);

  const loadBankData = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('professor_dados_bancarios')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setBankForm({
          holder: data.titular || '',
          document: data.documento || '',
          bank: data.banco || '',
          agency: data.agencia || '',
          account: data.conta || '',
          accountType: data.tipo_conta || '',
          pixKey: data.chave_pix || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados bancários:', error);
    }
  };

  const loadComissoesPendentes = async () => {
    if (!user?.id) return;
    try {
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('commission_ledger')
        .select(
          `
          id,
          total_commission,
          base_pct,
          affiliate_bonus_pct,
          status,
          created_at,
          cursos(titulo),
          transacoes_pagamento(valor)
        `
        )
        .eq('professor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(120);

      if (ledgerError) throw ledgerError;

      const ledgerRows = (ledgerData || []) as Array<{
        id: string;
        total_commission: number;
        base_pct: number;
        affiliate_bonus_pct: number;
        status: 'OPEN' | 'PAID' | 'REVERSED';
        created_at: string;
        cursos?: { titulo?: string } | null;
        transacoes_pagamento?: { valor?: number } | null;
      }>;

      const pendentesLedger = ledgerRows.filter((row) => row.status === 'OPEN');
      const total = pendentesLedger.length;
      const valor = pendentesLedger.reduce((sum, row) => sum + Number(row.total_commission || 0), 0);
      setComissoesPendentes({ total, valor });

      const mapped = ledgerRows
        .map((row) => ({
          id: row.id,
          curso_titulo: row.cursos?.titulo || 'Curso',
          valor_venda: Number(row.transacoes_pagamento?.valor || 0),
          percentual: Number(row.base_pct || 0) + Number(row.affiliate_bonus_pct || 0),
          valor_comissao: Number(row.total_commission || 0),
          status: row.status,
          data: row.created_at,
        }))
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 6);

      setComissoesRecentes(mapped);
    } catch (error) {
      console.error('Erro ao carregar comissões:', error);
    }
  };

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
      const totalPayments = paymentsData.length;
      const avgTicket = totalPayments > 0 ? totalRevenue / totalPayments : 0;

      const now = new Date();
      const start30d = new Date(now);
      start30d.setDate(start30d.getDate() - 30);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const revenue30d = paymentsData.reduce((sum, row) => {
        const date = row.criado_em ? new Date(row.criado_em) : null;
        if (!date || date < start30d) return sum;
        return sum + Number(row.valor || 0);
      }, 0);

      const revenueThisMonth = paymentsData.reduce((sum, row) => {
        const date = row.criado_em ? new Date(row.criado_em) : null;
        if (!date || date < monthStart) return sum;
        return sum + Number(row.valor || 0);
      }, 0);

      const revenuePrevMonth = paymentsData.reduce((sum, row) => {
        const date = row.criado_em ? new Date(row.criado_em) : null;
        if (!date || date < prevMonthStart || date > prevMonthEnd) return sum;
        return sum + Number(row.valor || 0);
      }, 0);

      const monthGrowth = revenuePrevMonth > 0
        ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100
        : null;

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

      const courseTitleById = filteredCourses.reduce((acc: Record<string, string>, course) => {
        acc[String(course.id)] = course.title;
        return acc;
      }, {});

      const revenueByCourseMap = paymentsData.reduce((acc: Record<string, number>, row) => {
        const key = String(row.curso_id);
        acc[key] = (acc[key] || 0) + Number(row.valor || 0);
        return acc;
      }, {});
      const revenueByCourseRows = Object.entries(revenueByCourseMap)
        .map(([courseId, revenue]) => ({
          name: courseTitleById[courseId] || 'Curso',
          revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setRevenueByCourse(revenueByCourseRows);

      setFinanceSnapshot({
        totalRevenue,
        revenue30d,
        totalPayments,
        avgTicket,
        monthGrowth,
      });

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

  const handleBankSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setBankSaving(true);
    try {
      const payload = {
        usuario_id: user.id,
        titular: bankForm.holder,
        documento: bankForm.document,
        banco: bankForm.bank,
        agencia: bankForm.agency,
        conta: bankForm.account,
        tipo_conta: bankForm.accountType,
        chave_pix: bankForm.pixKey,
        atualizado_em: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('professor_dados_bancarios')
        .upsert(payload, { onConflict: 'usuario_id' });

      if (error) throw error;

      toast.success('Dados bancários salvos com sucesso!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar dados bancários.');
    } finally {
      setBankSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Painel do professor</p>
          <h1 className="headline-font text-4xl md:text-5xl">Gestao com criterio</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <ThemeToggle />
          <Link to="/teacher/course/new-glass" className="btn-glass flex items-center gap-2 w-full sm:w-auto justify-center">
            <FaPlus />
            Novo Curso
          </Link>
        </div>
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

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: 'Receita 30 dias',
            value: `R$ ${financeSnapshot.revenue30d.toFixed(2)}`,
          },
          {
            label: 'Ticket medio',
            value: `R$ ${financeSnapshot.avgTicket.toFixed(2)}`,
          },
          {
            label: 'Pagamentos',
            value: financeSnapshot.totalPayments,
          },
          {
            label: 'Crescimento mensal',
            value: financeSnapshot.monthGrowth === null
              ? '—'
              : `${financeSnapshot.monthGrowth.toFixed(1)}%`,
          },
        ].map((item) => (
          <div key={item.label} className="card">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.label}</p>
              <p className="text-3xl font-semibold mt-2">{item.value}</p>
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
          <h2 className="text-xl font-semibold mb-4">Receita por curso</h2>
          {revenueByCourse.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem dados financeiros.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold">Meus cursos</h2>
            <Link to="/teacher/my-courses" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--accent))]">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600">{courses.filter(c => c.is_published).length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Publicados</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-2xl font-bold text-yellow-600">{courses.filter(c => c.em_curadoria && !c.is_published).length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Em Curadoria</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-600">{courses.filter(c => !c.is_published && !c.em_curadoria && !c.feedback_curadoria).length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Em Criação</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-2xl font-bold text-red-600">{courses.filter(c => !c.is_published && !!c.feedback_curadoria).length}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Rejeitados</p>
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-[hsl(var(--primary))] text-white text-xs font-bold px-3 py-1 rounded-full">
            Em breve
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white">
              <FaChartLine />
            </div>
            <h2 className="text-xl font-semibold">Maextria Ads</h2>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
            Aqui voce tera total controle sobre a visibilidade do seu curso para os alunos e visitantes. 
            Uma rede de anuncios interno para voce faturar mais.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Em desenvolvimento
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Minhas comissoes</h2>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Ultimos registros
            </span>
          </div>
          {comissoesRecentes.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma comissao registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {comissoesRecentes.map((item) => (
                <div key={item.id} className="p-3 border border-[hsl(var(--border))] rounded-[12px]">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.curso_titulo}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'REVERSED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'PAID' ? 'Pago' : item.status === 'REVERSED' ? 'Estornado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">
                      Venda: R$ {item.valor_venda.toFixed(2)} × {item.percentual}%
                    </span>
                    <span className="font-bold text-[hsl(var(--primary))]">
                      R$ {item.valor_comissao.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white">
              <FaDollarSign />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Comissoes pendentes</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Aguardando repasse</p>
            </div>
          </div>
          <div className="bg-[hsl(var(--muted))] rounded-[12px] p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Total de vendas pendentes:</span>
              <span className="font-semibold">{comissoesPendentes.total}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">Valor a receber:</span>
              <span className="text-xl font-bold text-[hsl(var(--primary))]">
                R$ {comissoesPendentes.valor.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
            O repasse e realizado periodicamente pela administracao da plataforma.
          </p>
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
            <input
              name="pixKey"
              value={bankForm.pixKey}
              onChange={handleBankChange}
              placeholder="Chave PIX (CPF, email, telefone ou aleatoria)"
              className="input-field"
            />
            <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={bankSaving}>
              {bankSaving ? 'Salvando...' : 'Salvar dados'}
              {!bankSaving && <FaArrowRight />}
            </button>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Estes dados serao utilizados para o repasse das suas comissoes.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
