import { useEffect, useMemo, useState } from 'react';
import { DashboardStats } from '../../types';
import { supabase } from '../../lib/supabase';
import { FaUsers, FaBook, FaDollarSign, FaChartLine, FaBullhorn } from 'react-icons/fa';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ThemeToggle from '../../components/ThemeToggle';

type AdminNotification = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criado_em: string;
  metadata?: Record<string, any>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<Array<{ month: string; revenue: number }>>([]);
  const [userDistribution, setUserDistribution] = useState<Array<{ name: string; value: number }>>([]);
  const [recentNotifications, setRecentNotifications] = useState<AdminNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [marketingStats, setMarketingStats] = useState({
    pageviews: 0,
    sessions: 0,
    topPages: [] as Array<{ path: string; total: number }>,
  });
  const [loadingMarketing, setLoadingMarketing] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Array<any>>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Array<any>>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'new'>('sent');
  const [broadcastForm, setBroadcastForm] = useState({
    target: 'students',
    subject: '',
    body: '',
  });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  useEffect(() => {
    loadStats();
    loadNotifications();
    loadMessaging();
    loadMarketingStats();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  const loadStats = async () => {
    try {
      const since = new Date();
      since.setMonth(since.getMonth() - 11);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const [
        coursesRes,
        enrollmentsRes,
        usersRes,
        rolesRes,
        matriculasRes,
        certificadosRes,
        revenueRes,
      ] = await Promise.all([
        supabase.from('cursos').select('id', { count: 'exact', head: true }),
        supabase.from('matriculas').select('id', { count: 'exact', head: true }),
        supabase.from('usuarios').select('id', { count: 'exact', head: true }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('matriculas').select('usuario_id').eq('ativa', true),
        supabase.from('certificados').select('usuario_id').eq('pago', true),
        supabase
          .from('transacoes_pagamento')
          .select('valor, criado_em')
          .eq('status', 'completo')
          .gte('criado_em', since.toISOString()),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (usersRes.error) throw usersRes.error;

      const totalUsers = usersRes.count ?? 0;
      const roleRows = rolesRes.error ? [] : (rolesRes.data || []);
      const adminIds = new Set(roleRows.filter((row) => row.role === 'admin').map((row) => row.user_id));
      const teacherIds = new Set(roleRows.filter((row) => row.role === 'teacher').map((row) => row.user_id));
      const roleIds = new Set([...adminIds, ...teacherIds]);
      const studentCount = Math.max(totalUsers - roleIds.size, 0);

      const matriculaIds = new Set((matriculasRes.data || []).map((row) => row.usuario_id));
      const enrolledStudents = [...matriculaIds].filter((id) => !roleIds.has(id)).length;

      const pagantesIds = new Set((certificadosRes.data || []).map((row) => row.usuario_id));
      const payingStudents = [...pagantesIds].filter((id) => !roleIds.has(id)).length;

      const revenueRows = revenueRes.error ? [] : (revenueRes.data || []);
      const revenueTotals = revenueRows.reduce((acc, row) => {
        const date = row.criado_em ? new Date(row.criado_em) : null;
        if (!date) return acc;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        acc.total += Number(row.valor || 0);
        acc.byMonth[key] = acc.byMonth[key] || { label, value: 0 };
        acc.byMonth[key].value += Number(row.valor || 0);
        return acc;
      }, { total: 0, byMonth: {} as Record<string, { label: string; value: number }> });

      const sortedMonths = Object.keys(revenueTotals.byMonth).sort();

      setStats({
        total_users: totalUsers,
        total_courses: coursesRes.count ?? 0,
        total_revenue: revenueTotals.total,
        total_enrollments: enrollmentsRes.count ?? 0,
      });

      setRevenueData(
        sortedMonths.map((month) => ({
          month: revenueTotals.byMonth[month].label,
          revenue: revenueTotals.byMonth[month].value,
        }))
      );

      setUserDistribution([
        { name: 'Cadastros', value: totalUsers },
        { name: 'Alunos', value: studentCount },
        { name: 'Matriculados', value: enrolledStudents },
        { name: 'Pagantes', value: payingStudents },
        { name: 'Admins', value: adminIds.size },
        { name: 'Professores', value: teacherIds.size },
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, tipo, titulo, descricao, criado_em, metadata')
      .gte('criado_em', since.toISOString())
      .order('criado_em', { ascending: false })
      .limit(6);

    if (!error) {
      setRecentNotifications(data || []);
    }

    setLoadingNotifications(false);
  };

  const loadMarketingStats = async () => {
    setLoadingMarketing(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: pageviews } = await supabase
        .from('marketing_pageviews')
        .select('path, session_id')
        .gte('created_at', since.toISOString());

      const total = pageviews?.length || 0;
      const sessionCount = new Set((pageviews || []).map((row: any) => row.session_id)).size;
      const counts = (pageviews || []).reduce((acc: Record<string, number>, row: any) => {
        acc[row.path] = (acc[row.path] || 0) + 1;
        return acc;
      }, {});
      const topPages = Object.entries(counts)
        .map(([path, count]) => ({ path, total: count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      setMarketingStats({
        pageviews: total,
        sessions: sessionCount,
        topPages,
      });
    } catch (error) {
      console.error('Error loading marketing stats:', error);
    } finally {
      setLoadingMarketing(false);
    }
  };


  const loadMessaging = async () => {
    setThreadsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? null;
      setCurrentUserId(userId);

      const { data: threadsData } = await supabase
        .from('internal_threads')
        .select('id, type, subject, created_at, expires_at, created_by, created_by_role, recipient_role, internal_messages!inner(id)')
        .eq('type', 'broadcast')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      setThreads(threadsData || []);
      if ((threadsData || []).length > 0) {
        setSelectedThreadId(threadsData?.[0]?.id ?? null);
      } else {
        setSelectedThreadId(null);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const { data } = await supabase
        .from('internal_messages')
        .select('id, body, created_at, sender_id, sender_role')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      setThreadMessages(data || []);
    } catch (error) {
      console.error('Error loading thread messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const relativeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }),
    []
  );

  const formatTimeAgo = (value: string) => {
    const date = new Date(value);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (Number.isNaN(diffSeconds)) return 'agora';

    const minutes = Math.floor(diffSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (Math.abs(days) >= 1) {
      return relativeFormatter.format(-days, 'day');
    }
    if (Math.abs(hours) >= 1) {
      return relativeFormatter.format(-hours, 'hour');
    }
    if (Math.abs(minutes) >= 1) {
      return relativeFormatter.format(-minutes, 'minute');
    }
    return relativeFormatter.format(-diffSeconds, 'second');
  };

  const handleBroadcastChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setBroadcastForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      toast.error('Você precisa estar logado para enviar.');
      return;
    }
    setSendingBroadcast(true);
    try {
      const subject = broadcastForm.subject.trim();
      const body = broadcastForm.body.trim();
      if (!subject || !body) {
        throw new Error('Preencha assunto e mensagem.');
      }
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const recipientRole = broadcastForm.target === 'teachers'
        ? 'teacher'
        : broadcastForm.target === 'all'
          ? 'all'
          : 'student';

      const { data: thread, error: threadError } = await supabase
        .from('internal_threads')
        .insert({
          type: 'broadcast',
          subject,
          created_by: currentUserId,
          recipient_role: recipientRole,
          expires_at: expiresAt,
          created_by_role: 'admin',
        })
        .select('id')
        .single();
      if (threadError) throw threadError;

      const { error: messageError } = await supabase
        .from('internal_messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUserId,
          body,
          sender_role: 'admin',
        });
      if (messageError) throw messageError;

      toast.success('Mensagem enviada.');
      setBroadcastForm({ target: 'students', subject: '', body: '' });
      await loadMessaging();
      setSelectedThreadId(thread.id);
      setActiveTab('sent');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao enviar mensagem.');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteNotification = async (threadId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('internal_threads')
        .delete()
        .eq('id', threadId)
        .eq('created_by', currentUserId);
      if (error) throw error;
      toast.success('Notificacao excluida.');
      setThreadMessages([]);
      await loadMessaging();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir notificacao.');
    }
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(190 80% 45%)',
    'hsl(145 60% 38%)',
    'hsl(25 85% 55%)',
  ];

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
        <ThemeToggle />
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

      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
              <FaBullhorn />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Metricas de marketing (30 dias)</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Visao geral de alcance e trafego</p>
            </div>
          </div>
        </div>
        {loadingMarketing ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando metricas...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Pageviews</p>
              <p className="text-3xl font-semibold mt-2">{marketingStats.pageviews}</p>
            </div>
            <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Sessoes</p>
              <p className="text-3xl font-semibold mt-2">{marketingStats.sessions}</p>
            </div>
            <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Top paginas</p>
              <div className="mt-2 space-y-2">
                {marketingStats.topPages.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem dados</p>
                ) : (
                  marketingStats.topPages.map((item) => (
                    <div key={item.path} className="flex items-center justify-between text-sm">
                      <span className="truncate max-w-[160px]">{item.path}</span>
                      <span className="text-[hsl(var(--primary))] font-semibold">{item.total}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-xl font-semibold">Atividade recente</h2>
          <Link to="/admin/notifications" className="text-sm text-[hsl(var(--primary))] hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-3">
          {loadingNotifications ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando notificações...</p>
          ) : recentNotifications.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem atividades recentes.</p>
          ) : (
            recentNotifications.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-[hsl(var(--border))] rounded-[12px]">
                <div>
                  <p className="font-semibold">{item.titulo}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.descricao}</p>
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                  {formatTimeAgo(item.criado_em)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card mt-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaBullhorn />
            Notificacoes
          </h2>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <button
              type="button"
              className={`${activeTab === 'sent' ? 'btn-accent' : 'btn-outline'} w-full sm:w-auto`}
              onClick={() => setActiveTab('sent')}
            >
              Enviadas
            </button>
            <button
              type="button"
              className={`${activeTab === 'new' ? 'btn-accent' : 'btn-outline'} w-full sm:w-auto`}
              onClick={() => setActiveTab('new')}
            >
              Nova notificacao
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Notificacoes enviadas</p>
            {threadsLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma notificacao enviada.</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left p-3 rounded-[12px] border transition ${
                    selectedThreadId === thread.id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-sm font-semibold">{thread.subject}</p>
                    <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))]">
                      Notificacao
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {thread.recipient_role === 'teacher'
                      ? 'Professores'
                      : thread.recipient_role === 'student'
                        ? 'Alunos'
                        : 'Todos'}
                  </p>
                </button>
              ))
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'new' && (
              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Nova notificacao</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    name="target"
                    value={broadcastForm.target}
                    onChange={handleBroadcastChange}
                    className="input-field"
                  >
                    <option value="students">Alunos</option>
                    <option value="teachers">Professores</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
                <input
                  name="subject"
                  value={broadcastForm.subject}
                  onChange={handleBroadcastChange}
                  placeholder="Assunto do comunicado"
                  className="input-field"
                  required
                />
                <textarea
                  name="body"
                  value={broadcastForm.body}
                  onChange={handleBroadcastChange}
                  placeholder="Escreva o comunicado"
                  className="input-field min-h-[140px]"
                  required
                />
                <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={sendingBroadcast}>
                  {sendingBroadcast ? 'Enviando...' : 'Enviar notificacao'}
                </button>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Os comunicados expiram automaticamente em 30 dias.
                </p>
              </form>
            )}

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Conteudo</p>
              {activeTab === 'sent' && selectedThreadId ? (
                messagesLoading ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando mensagens...</p>
                ) : threadMessages.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem mensagens nesta conversa.</p>
                ) : (
                  <div className="space-y-3">
                    {threadMessages.map((message) => {
                      const bubbleClass = 'border border-black bg-black text-white';
                      return (
                        <div key={message.id} className={`rounded-[12px] border p-3 ${bubbleClass}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Equipe MAEXTRIA</p>
                          </div>
                          <p className="text-sm mt-2 whitespace-pre-line text-white">{message.body}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                            {new Date(message.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {activeTab === 'sent' ? 'Selecione uma notificacao ao lado.' : 'Crie um novo comunicado.'}
                </p>
              )}
            </div>
            {activeTab === 'sent' && selectedThreadId && (
              <div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => handleDeleteNotification(selectedThreadId)}
                >
                  Excluir notificacao
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
