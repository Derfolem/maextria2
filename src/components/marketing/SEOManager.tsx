import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  TrendingUp, 
  Link2, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Globe,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export const SEOManager = () => {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const seoScore = 87;
  const seoIssues = [
    { type: "success", title: "Título SEO otimizado", description: "Todas as páginas têm títulos adequados" },
    { type: "success", title: "Meta descrições presentes", description: "Meta tags configuradas corretamente" },
    { type: "warning", title: "Velocidade de carregamento", description: "Algumas páginas podem ser otimizadas" },
    { type: "error", title: "Imagens sem alt text", description: "12 imagens sem texto alternativo" },
    { type: "success", title: "Sitemap.xml ativo", description: "Sitemap configurado e acessível" },
  ];

  const keywords = [
    { word: "cursos online", volume: "12.5K", difficulty: 45, position: 3, trend: "up" },
    { word: "certificado digital", volume: "8.2K", difficulty: 38, position: 7, trend: "up" },
    { word: "educação online", volume: "15.8K", difficulty: 52, position: 12, trend: "down" },
    { word: "curso grátis", volume: "22.1K", difficulty: 68, position: 5, trend: "up" },
  ];

  const backlinks = [
    { domain: "exemplo.com.br", authority: 85, type: "dofollow", anchor: "cursos online" },
    { domain: "educacao.org", authority: 72, type: "dofollow", anchor: "certificados" },
    { domain: "blog.tech.com", authority: 58, type: "nofollow", anchor: "maextria" },
  ];

  const handleAnalyze = () => {
    if (!url) {
      toast.error("Insira uma URL para análise");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.success("Análise SEO concluída!");
    }, 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEO Manager</h2>
          <p className="text-muted-foreground">Otimize seu site para mecanismos de busca</p>
        </div>
      </div>

      {/* Score Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Pontuação SEO Geral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-5xl font-bold ${getScoreColor(seoScore)}`}>
                  {seoScore}
                </span>
                <span className="text-2xl text-muted-foreground">/100</span>
              </div>
              <Progress 
                value={seoScore} 
                className="h-2" 
              />
              <p className="text-sm text-muted-foreground mt-2">
                Seu site está bem otimizado! Continue assim.
              </p>
            </div>
            <div className="text-center">
              <Globe className="h-16 w-16 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Performance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analise" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analise">Análise de Página</TabsTrigger>
          <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="issues">Problemas</TabsTrigger>
        </TabsList>

        {/* Análise de Página */}
        <TabsContent value="analise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisar URL</CardTitle>
              <CardDescription>Digite a URL que deseja analisar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url">URL da Página</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    placeholder="https://maextria.com/exemplo"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? "Analisando..." : "Analisar"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Título</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">52 caracteres</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Meta Description</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">148 caracteres</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Velocidade</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">2.3s</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Palavras-chave */}
        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Pesquisar Palavra-chave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma palavra-chave"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Pesquisar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Palavras-chave Monitoradas</CardTitle>
              <CardDescription>Acompanhe o desempenho das suas principais keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {keywords.map((kw, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{kw.word}</h4>
                            <Badge variant="outline">#{kw.position}</Badge>
                            {kw.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Volume: {kw.volume}/mês</span>
                            <span>Dificuldade: {kw.difficulty}/100</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backlinks */}
        <TabsContent value="backlinks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Perfil de Backlinks
              </CardTitle>
              <CardDescription>
                {backlinks.length} backlinks de domínios únicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backlinks.map((link, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold">{link.domain}</h4>
                            <Badge variant={link.type === "dofollow" ? "default" : "secondary"}>
                              {link.type}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Autoridade: {link.authority}/100</span>
                            <span>Âncora: "{link.anchor}"</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Ver todos os backlinks
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Problemas */}
        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Problemas e Recomendações</CardTitle>
              <CardDescription>Itens que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {seoIssues.map((issue, index) => {
                  const Icon = issue.type === "success" 
                    ? CheckCircle2 
                    : issue.type === "warning" 
                    ? AlertCircle 
                    : XCircle;
                  
                  const iconColor = issue.type === "success"
                    ? "text-green-500"
                    : issue.type === "warning"
                    ? "text-yellow-500"
                    : "text-red-500";

                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{issue.title}</h4>
                            <p className="text-sm text-muted-foreground">{issue.description}</p>
                          </div>
                          {issue.type !== "success" && (
                            <Button variant="outline" size="sm">
                              Corrigir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};