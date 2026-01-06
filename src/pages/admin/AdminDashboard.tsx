import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, Award, CheckCircle, DollarSign, Settings, UserCog, Mail, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCursos: 0,
    totalAlunos: 0,
    totalProvas: 0,
    totalCertificados: 0,
    totalMensagens: 0,
  });
  const [userDistribution, setUserDistribution] = useState({
    alunos: 0,
    admins: 0,
    professores: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [cursos, usuarios, provas, certificados, mensagens, admins, colaboradores] = await Promise.all([
        supabase.from("cursos").select("id", { count: "exact", head: true }),
        supabase.from("usuarios").select("id", { count: "exact", head: true }),
        supabase.from("prova_resultado").select("id", { count: "exact", head: true }),
        supabase.from("certificados").select("id", { count: "exact", head: true }),
        supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("status", "nao_lida"),
        supabase.from("user_roles").select("user_id").eq("role", "admin"),
        supabase.from("colaboradores").select("usuario_id").eq("ativo", true),
      ]);

      const adminIds = new Set((admins.data || []).map((row) => row.user_id));
      const professorIds = new Set((colaboradores.data || []).map((row) => row.usuario_id));
      const professoresSemAdmin = [...professorIds].filter((id) => !adminIds.has(id));
      const totalUsuarios = usuarios.count || 0;
      const adminsCount = adminIds.size;
      const professoresCount = professoresSemAdmin.length;
      const alunosCount = Math.max(totalUsuarios - adminsCount - professoresCount, 0);

      setStats({
        totalCursos: cursos.count || 0,
        totalAlunos: usuarios.count || 0,
        totalProvas: provas.count || 0,
        totalCertificados: certificados.count || 0,
        totalMensagens: mensagens.count || 0,
      });

      setUserDistribution({
        alunos: alunosCount,
        admins: adminsCount,
        professores: professoresCount,
        total: totalUsuarios,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total de Cursos",
      value: stats.totalCursos,
      icon: BookOpen,
      link: "/admin/cursos",
    },
    {
      title: "Total de Alunos",
      value: stats.totalAlunos,
      icon: Users,
      link: "#",
    },
    {
      title: "Provas Realizadas",
      value: stats.totalProvas,
      icon: CheckCircle,
      link: "#",
    },
    {
      title: "Certificados Emitidos",
      value: stats.totalCertificados,
      icon: Award,
      link: "#",
    },
  ];

  const userChartData = [
    { name: "Alunos", value: userDistribution.alunos, color: "hsl(var(--chart-1))" },
    { name: "Admins", value: userDistribution.admins, color: "hsl(var(--chart-2))" },
    { name: "Professores", value: userDistribution.professores, color: "hsl(var(--chart-3))" },
  ];
  const totalUserCount = userChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/admin/cursos/novo">
                <BookOpen className="mr-2 h-4 w-4" />
                Criar Novo Curso
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/cursos">
                <BookOpen className="mr-2 h-4 w-4" />
                Gerenciar Cursos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/financeiro">
                <DollarSign className="mr-2 h-4 w-4" />
                Financeiro
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configurações do Site
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/usuarios">
                <UserCog className="mr-2 h-4 w-4" />
                Gerenciar Usuários
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/colaboradores">
                <UserCog className="mr-2 h-4 w-4" />
                Gerenciar Colaboradores
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/marketing">
                <BarChart3 className="mr-2 h-4 w-4" />
                Marketing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/mensagens">
                <Mail className="mr-2 h-4 w-4" />
                Mensagens {stats.totalMensagens > 0 && `(${stats.totalMensagens})`}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing & Análises</CardTitle>
            <CardDescription>Acesse as ferramentas de marketing e análise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link to="/admin/marketing">
                <BarChart3 className="mr-2 h-4 w-4" />
                Dashboard de Marketing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/marketing/calendario">
                Calendário Editorial
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/marketing/crm">
                CRM de Leads
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/admin/marketing/seo">
                SEO Manager
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Usuários</CardTitle>
            <CardDescription>Percentual por tipo de conta</CardDescription>
          </CardHeader>
          <CardContent>
            {totalUserCount > 0 ? (
              <ChartContainer config={{}} className="h-[240px]">
                <PieChart>
                  <Pie
                    data={userChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {userChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados para exibir.</p>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div>
                <div className="text-base font-semibold text-foreground">{userDistribution.alunos}</div>
                Alunos
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">{userDistribution.admins}</div>
                Admins
              </div>
              <div>
                <div className="text-base font-semibold text-foreground">{userDistribution.professores}</div>
                Professores
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Bem-vindo ao painel administrativo da MAEXTRIA. Aqui você pode
              gerenciar todos os aspectos da plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
