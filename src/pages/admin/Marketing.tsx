import { useState } from "react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Eye,
  Calendar,
  Zap,
  FileText,
  Wrench,
  Share2,
  MessageSquare
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { useMarketingData } from "@/hooks/useMarketingData";
import { CopyGenerator } from "@/components/marketing/CopyGenerator";
import { CalendarioEditorial } from "@/components/marketing/CalendarioEditorial";
import { CRMLeads } from "@/components/marketing/CRMLeads";

const sourceData = [
  { name: "Google", value: 35, color: "#00E676" },
  { name: "Instagram", value: 25, color: "#7C4DFF" },
  { name: "TikTok", value: 20, color: "#1A237E" },
  { name: "YouTube", value: 12, color: "#00BCD4" },
  { name: "LinkedIn", value: 8, color: "#FF6B6B" },
];

const KPICard = ({ title, value, change, icon: Icon, color }: any) => (
  <Card className="hover-scale">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4" style={{ color }} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        <span style={{ color: change >= 0 ? "#00E676" : "#FF6B6B" }}>
          {change >= 0 ? "+" : ""}{change}%
        </span> desde o último mês
      </p>
    </CardContent>
  </Card>
);

export default function Marketing() {
  const [activeTab, setActiveTab] = useState("visao-geral");
  const { data: marketingData, isLoading } = useMarketingData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8" style={{ color: "#7C4DFF" }} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A237E] via-[#7C4DFF] to-[#00E676] bg-clip-text text-transparent">
              Painel de Marketing Maextria
            </h1>
          </div>
          <p className="text-muted-foreground">
            Aprender • Aplicar • Expandir
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <KPICard 
            title="Matrículas Totais" 
            value={formatNumber(marketingData?.kpis.alcanceTotal || 0)} 
            change={marketingData?.kpis.crescimento.alcance || 0} 
            icon={Eye}
            color="#7C4DFF"
          />
          <KPICard 
            title="Leads Gerados" 
            value={formatNumber(marketingData?.kpis.leadsGerados || 0)} 
            change={marketingData?.kpis.crescimento.leads || 0} 
            icon={Users}
            color="#00E676"
          />
          <KPICard 
            title="Taxa de Conversão" 
            value={`${marketingData?.kpis.taxaConversao || 0}%`} 
            change={marketingData?.kpis.crescimento.conversao || 0} 
            icon={Target}
            color="#1A237E"
          />
          <KPICard 
            title="Receita Total" 
            value={formatCurrency(marketingData?.kpis.roiMedio || 0)} 
            change={marketingData?.kpis.crescimento.receita || 0} 
            icon={DollarSign}
            color="#00E676"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-9 h-auto gap-2">
            <TabsTrigger value="visao-geral" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="crm" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="organico" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Orgânico</span>
            </TabsTrigger>
            <TabsTrigger value="pago" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pago</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="automacao" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Automação</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="ferramentas" className="gap-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Ferramentas</span>
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tráfego Orgânico vs Pago</CardTitle>
                  <CardDescription>Comparativo mensal dos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marketingData?.mesesData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="organico" 
                        stroke="#00E676" 
                        strokeWidth={2}
                        name="Novos Leads"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pago" 
                        stroke="#7C4DFF" 
                        strokeWidth={2}
                        name="Matrículas"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fontes de Aquisição</CardTitle>
                  <CardDescription>Distribuição de tráfego por canal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversões Mensais</CardTitle>
                  <CardDescription>Total de conversões por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marketingData?.mesesData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversoes" fill="#7C4DFF" name="Certificados Vendidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance por Curso</CardTitle>
                  <CardDescription>Top 5 cursos com melhor desempenho</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={marketingData?.cursosPerformance?.slice(0, 5) || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="curso" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="matriculas" fill="#7C4DFF" name="Matrículas" />
                      <Bar dataKey="certificados" fill="#00E676" name="Certificados" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Calendário Editorial */}
          <TabsContent value="calendario" className="animate-fade-in">
            <CalendarioEditorial />
          </TabsContent>

          {/* CRM de Leads */}
          <TabsContent value="crm" className="animate-fade-in">
            <CRMLeads />
          </TabsContent>

          {/* Marketing Orgânico */}
          <TabsContent value="organico" className="animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendário Editorial Inteligente
                  </CardTitle>
                  <CardDescription>Crie, agende e visualize postagens para todas as redes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Calendário será implementado na próxima fase</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Redes Sociais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {["Instagram", "Facebook", "LinkedIn", "TikTok", "YouTube"].map((network) => (
                    <Button key={network} variant="outline" className="w-full justify-start">
                      {network}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Pontuação SEO</p>
                      <div className="text-3xl font-bold" style={{ color: "#00E676" }}>87/100</div>
                    </div>
                    <Button variant="outline" className="w-full">Analisar Palavras-chave</Button>
                    <Button variant="outline" className="w-full">Verificar Backlinks</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Biblioteca de Conteúdo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-4 border-2 border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">247 arquivos</p>
                      <p className="text-xs text-muted-foreground">Imagens, vídeos e textos</p>
                    </div>
                    <Button variant="outline" className="w-full">Gerenciar Biblioteca</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Marketing Pago */}
          <TabsContent value="pago" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Campanhas Pagas</CardTitle>
                <CardDescription>Integração com Google Ads, Meta Ads, TikTok e LinkedIn</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Integrações serão implementadas na próxima fase</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads e CRM */}
          <TabsContent value="leads" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline de Vendas</CardTitle>
                <CardDescription>Funil visual com gestão de leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">CRM será implementado na próxima fase</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automação */}
          <TabsContent value="automacao" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Fluxos de Automação
                </CardTitle>
                <CardDescription>Crie jornadas automatizadas para seus leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Automações serão implementadas na próxima fase</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios e Análises</CardTitle>
                <CardDescription>Dashboard analítico com filtros dinâmicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">Relatórios avançados serão implementados na próxima fase</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ferramentas */}
          <TabsContent value="ferramentas" className="animate-fade-in">
            <CopyGenerator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Card className="hover-scale cursor-pointer opacity-50">
                <CardHeader>
                  <CardTitle>Gerador de Imagens IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Em breve: Crie imagens com IA</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer opacity-50">
                <CardHeader>
                  <CardTitle>Calculadora de ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Em breve: Calcule retorno sobre investimento</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer opacity-50">
                <CardHeader>
                  <CardTitle>Analisador de Concorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Em breve: Monitore concorrência</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
