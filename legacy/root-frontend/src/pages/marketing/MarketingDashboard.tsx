import { useState } from "react";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign, 
  Eye
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

export default function MarketingDashboard() {
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
        <MarketingNavbar />
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
      <MarketingNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8" style={{ color: "#7C4DFF" }} />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#1A237E] via-[#7C4DFF] to-[#00E676] bg-clip-text text-transparent">
              Dashboard de Marketing
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

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
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
      </div>
    </div>
  );
}