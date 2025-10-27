import { useState } from "react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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

// Dados simulados
const monthlyData = [
  { mes: "Jan", organico: 4000, pago: 2400, conversoes: 240 },
  { mes: "Fev", organico: 3000, pago: 1398, conversoes: 221 },
  { mes: "Mar", organico: 2000, pago: 9800, conversoes: 229 },
  { mes: "Abr", organico: 2780, pago: 3908, conversoes: 200 },
  { mes: "Mai", organico: 1890, pago: 4800, conversoes: 218 },
  { mes: "Jun", organico: 2390, pago: 3800, conversoes: 250 },
];

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
            title="Alcance Total" 
            value="125.4K" 
            change={12.5} 
            icon={Eye}
            color="#7C4DFF"
          />
          <KPICard 
            title="Leads Gerados" 
            value="3.247" 
            change={8.2} 
            icon={Users}
            color="#00E676"
          />
          <KPICard 
            title="Taxa de Conversão" 
            value="4.8%" 
            change={-2.4} 
            icon={Target}
            color="#1A237E"
          />
          <KPICard 
            title="ROI Médio" 
            value="R$ 15.2K" 
            change={18.7} 
            icon={DollarSign}
            color="#00E676"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto gap-2">
            <TabsTrigger value="visao-geral" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
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
              <Users className="h-4 w-4" />
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
                    <LineChart data={monthlyData}>
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
                        name="Orgânico"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pago" 
                        stroke="#7C4DFF" 
                        strokeWidth={2}
                        name="Pago"
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
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="conversoes" fill="#7C4DFF" name="Conversões" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campanhas Ativas</CardTitle>
                  <CardDescription>Status das campanhas em andamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: "Lançamento Curso IA", status: "Ativo", budget: "R$ 5.000", performance: "Alta" },
                    { name: "Black Friday Maextria", status: "Ativo", budget: "R$ 8.000", performance: "Média" },
                    { name: "Retargeting Geral", status: "Pausada", budget: "R$ 2.000", performance: "Baixa" },
                  ].map((campaign, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">{campaign.budget}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          campaign.status === "Ativo" ? "bg-green-500/20 text-green-600" : "bg-yellow-500/20 text-yellow-600"
                        }`}>
                          {campaign.status}
                        </span>
                        <p className="text-sm text-muted-foreground mt-1">
                          Performance: {campaign.performance}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Gerador de Copy IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Crie textos persuasivos para anúncios e posts</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle>Banco de Ideias</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Gatilhos mentais e ideias de conteúdo prontas</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle>Gerador de Imagens IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Crie imagens e vídeos com inteligência artificial</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle>Calculadora de ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Calcule o retorno sobre investimento</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle>Assistente de Campanha</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">IA que analisa e sugere melhorias em tempo real</p>
                </CardContent>
              </Card>

              <Card className="hover-scale cursor-pointer">
                <CardHeader>
                  <CardTitle>Analisador de Concorrentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Monitore a estratégia dos concorrentes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
