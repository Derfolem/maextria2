import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Transaction {
  id: string;
  usuario_id: string;
  curso_id: string;
  valor: number;
  status: string;
  criado_em: string;
  usuarios: {
    nome_completo: string;
    email: string;
  };
  curso: {
    titulo: string;
  };
}

interface Stats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
  certificatesSold: number;
  growthRate: number;
}

interface CourseRevenue {
  curso_titulo: string;
  total: number;
  vendas: number;
}

interface ChartData {
  name: string;
  value: number;
}

export default function Financeiro() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    certificatesSold: 0,
    growthRate: 0,
  });
  const [courseRevenue, setCourseRevenue] = useState<CourseRevenue[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      navigate("/");
    }
  };

  const fetchData = async () => {
    try {
      const { data: allTransactions } = await supabase
        .from("transacoes_pagamento")
        .select("*")
        .order("criado_em", { ascending: false });

      if (!allTransactions) return;

      // Buscar dados de usuários e cursos separadamente
      const enrichedTransactions = await Promise.all(
        allTransactions.map(async (t) => {
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("nome_completo, email")
            .eq("id", t.usuario_id)
            .maybeSingle();

          const { data: curso } = await supabase
            .from("cursos")
            .select("titulo")
            .eq("id", t.curso_id)
            .maybeSingle();

          return {
            ...t,
            usuarios: usuario || { nome_completo: "N/A", email: "N/A" },
            curso: curso || { titulo: "N/A" },
          };
        })
      );

      const paidTransactions = enrichedTransactions.filter((t) => t.status === "pago");
      const totalRevenue = paidTransactions.reduce(
        (sum, t) => sum + parseFloat(t.valor.toString()),
        0
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyTransactions = enrichedTransactions.filter(
        (t) => new Date(t.criado_em) >= thirtyDaysAgo && t.status === "pago"
      );

      const monthlyRevenue = monthlyTransactions.reduce(
        (sum, t) => sum + parseFloat(t.valor.toString()),
        0
      );

      // Calcular crescimento
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const previousMonthTransactions = enrichedTransactions.filter(
        (t) => new Date(t.criado_em) >= sixtyDaysAgo && 
               new Date(t.criado_em) < thirtyDaysAgo && 
               t.status === "pago"
      );
      
      const previousMonthRevenue = previousMonthTransactions.reduce(
        (sum, t) => sum + parseFloat(t.valor.toString()),
        0
      );

      const growthRate = previousMonthRevenue > 0 
        ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      // Agrupar por curso
      const revenueMap = new Map<string, { total: number; vendas: number }>();
      paidTransactions.forEach((t) => {
        const current = revenueMap.get(t.curso?.titulo || "Desconhecido") || { total: 0, vendas: 0 };
        revenueMap.set(t.curso?.titulo || "Desconhecido", {
          total: current.total + parseFloat(t.valor.toString()),
          vendas: current.vendas + 1,
        });
      });

      const courseRevenueData: CourseRevenue[] = Array.from(revenueMap.entries()).map(
        ([curso_titulo, data]) => ({
          curso_titulo,
          total: data.total,
          vendas: data.vendas,
        })
      ).sort((a, b) => b.total - a.total);

      setCourseRevenue(courseRevenueData);
      setChartData(courseRevenueData.slice(0, 5).map(c => ({ name: c.curso_titulo, value: c.total })));

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalTransactions: enrichedTransactions.length,
        certificatesSold: paidTransactions.length,
        growthRate,
      });
      setTransactions(enrichedTransactions.slice(0, 10) as Transaction[]);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const exportReport = () => {
    const reportData = {
      geradoEm: new Date().toLocaleString('pt-BR'),
      resumo: stats,
      receitaPorCurso: courseRevenue,
      ultimasTransacoes: transactions,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string }> = {
      pago: { label: "Pago" },
      pendente: { label: "Pendente" },
      expirado: { label: "Expirado" },
      cancelado: { label: "Cancelado" },
    };

    return (
      <Badge variant={status === "pago" ? "default" : "secondary"}>
        {statusConfig[status]?.label || status}
      </Badge>
    );
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--chart-1))'];

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Financeiro</h1>
            <p className="text-muted-foreground">Análises e métricas de desempenho</p>
          </div>
          <Button onClick={exportReport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.monthlyRevenue)}
              </div>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.growthRate >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(stats.growthRate).toFixed(1)}% vs mês anterior
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Transações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Certificados Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.certificatesSold}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Desempenho por Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Receita Total</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courseRevenue.map((curso) => (
                  <TableRow key={curso.curso_titulo}>
                    <TableCell className="font-medium">{curso.curso_titulo}</TableCell>
                    <TableCell>{curso.vendas}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(curso.total)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(curso.total / curso.vendas)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação registrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.criado_em).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.usuarios?.nome_completo || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.usuarios?.email || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.curso?.titulo || "N/A"}</TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(parseFloat(transaction.valor.toString()))}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
