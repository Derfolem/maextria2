import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, CreditCard, FileText } from "lucide-react";

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
  cursos: {
    titulo: string;
  };
}

interface Stats {
  receitaTotal: number;
  receitaMes: number;
  totalTransacoes: number;
  certificadosVendidos: number;
}

export default function Financeiro() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    receitaTotal: 0,
    receitaMes: 0,
    totalTransacoes: 0,
    certificadosVendidos: 0,
  });
  const [loading, setLoading] = useState(true);

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
    setLoading(true);

    // Fetch all transactions
    const { data: transacoesData } = await supabase
      .from("transacoes_pagamento")
      .select(`
        *,
        usuarios(nome_completo, email),
        cursos(titulo)
      `)
      .order("criado_em", { ascending: false })
      .limit(50);

    if (transacoesData) {
      setTransactions(transacoesData as any);

      // Calculate stats
      const completas = transacoesData.filter((t) => t.status === "completo");
      const receitaTotal = completas.reduce((sum, t) => sum + Number(t.valor), 0);

      const mesAtual = new Date();
      mesAtual.setDate(1);
      mesAtual.setHours(0, 0, 0, 0);

      const transacoesMes = completas.filter(
        (t) => new Date(t.criado_em) >= mesAtual
      );
      const receitaMes = transacoesMes.reduce((sum, t) => sum + Number(t.valor), 0);

      setStats({
        receitaTotal,
        receitaMes,
        totalTransacoes: transacoesData.length,
        certificadosVendidos: completas.length,
      });
    }

    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completo: { variant: "default", label: "Completo" },
      pendente: { variant: "secondary", label: "Pendente" },
      cancelado: { variant: "destructive", label: "Cancelado" },
      reembolsado: { variant: "outline", label: "Reembolsado" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral de transações e vendas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.receitaTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.receitaMes.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mês atual
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransacoes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Certificados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.certificadosVendidos}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Vendidos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas 50 transações registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma transação registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
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
                        <TableCell>{transaction.cursos?.titulo || "N/A"}</TableCell>
                        <TableCell className="font-medium">
                          R$ {Number(transaction.valor).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
