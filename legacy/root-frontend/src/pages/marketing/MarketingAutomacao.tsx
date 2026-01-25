import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function MarketingAutomacao() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <div className="container mx-auto px-4 py-8">
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
              <p className="text-muted-foreground">Automações serão implementadas em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}