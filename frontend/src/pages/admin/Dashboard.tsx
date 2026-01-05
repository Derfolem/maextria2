import { useEffect, useState } from 'react';
import { DashboardStats } from '../../types';
import api from '../../lib/api';
import { FaUsers, FaBook, FaDollarSign, FaChartLine } from 'react-icons/fa';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [userDistribution, setUserDistribution] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/dashboard/admin');
      const data = response.data;
      const users = data.users || {};
      const totalUsers = Object.values(users).reduce((sum: number, value: any) => sum + Number(value || 0), 0);

      setStats({
        total_users: totalUsers,
        total_courses: data.totalCourses || 0,
        total_revenue: data.certificates?.totalRevenue || 0,
        total_enrollments: data.certificates?.total || 0,
      });

      setRevenueData(
        (data.revenueByMonth || []).map((item: any) => ({
          month: item.month,
          revenue: item.total_revenue || 0,
        }))
      );

      setUserDistribution([
        { name: 'Alunos', value: users.student || 0 },
        { name: 'Professores', value: users.teacher || 0 },
        { name: 'Admins', value: users.admin || 0 },
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

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

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Administracao</p>
          <h1 className="headline-font text-4xl md:text-5xl">Visao geral da plataforma</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total de usuarios', value: stats.total_users || 0, icon: <FaUsers /> },
          { label: 'Total de cursos', value: stats.total_courses || 0, icon: <FaBook /> },
          { label: 'Receita total', value: `R$ ${(stats.total_revenue || 0).toFixed(2)}`, icon: <FaDollarSign /> },
          { label: 'Matriculas', value: stats.total_enrollments || 0, icon: <FaChartLine /> },
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

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Receita mensal</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Receita" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Distribuicao de usuarios</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {userDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Atividade recente</h2>
        <div className="space-y-3">
          {[
            {
              title: 'Nova matricula',
              desc: 'Joao Silva se inscreveu em "React Avancado"',
              time: 'Ha 2 horas',
            },
            {
              title: 'Novo curso publicado',
              desc: 'Maria Santos publicou "Python para Iniciantes"',
              time: 'Ha 5 horas',
            },
            {
              title: 'Certificado emitido',
              desc: 'Carlos Oliveira concluiu "JavaScript Essencial"',
              time: 'Ha 1 dia',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-between p-3 border border-[hsl(var(--border))] rounded-[12px]">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.desc}</p>
              </div>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
