import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { CopyGenerator } from "@/components/marketing/CopyGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketingFerramentas() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container mx-auto px-4 py-8">
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
              <CardTitle>Análise de Sentimento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Em breve: Analise feedback de alunos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}