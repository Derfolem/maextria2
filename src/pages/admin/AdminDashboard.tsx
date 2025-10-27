import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, Award, CheckCircle, DollarSign, Settings, UserCog, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCursos: 0,
    totalAlunos: 0,
    totalProvas: 0,
    totalCertificados: 0,
    totalMensagens: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [cursos, usuarios, provas, certificados, mensagens] = await Promise.all([
        supabase.from("cursos").select("id", { count: "exact", head: true }),
        supabase.from("usuarios").select("id", { count: "exact", head: true }),
        supabase.from("prova_resultado").select("id", { count: "exact", head: true }),
        supabase.from("certificados").select("id", { count: "exact", head: true }),
        supabase.from("mensagens").select("id", { count: "exact", head: true }).eq("status", "nao_lida"),
      ]);

      setStats({
        totalCursos: cursos.count || 0,
        totalAlunos: usuarios.count || 0,
        totalProvas: provas.count || 0,
        totalCertificados: certificados.count || 0,
        totalMensagens: mensagens.count || 0,
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

      <div className="grid gap-6 md:grid-cols-2">
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
              <Link to="/admin/mensagens">
                <Mail className="mr-2 h-4 w-4" />
                Mensagens {stats.totalMensagens > 0 && `(${stats.totalMensagens})`}
              </Link>
            </Button>
          </CardContent>
        </Card>

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
