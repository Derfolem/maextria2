import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Target, Heart } from "lucide-react";

export default function Sobre() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Sobre a <span className="text-primary">MAEXTRIA</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Mais do que uma plataforma de ensino. Um movimento de transformação pessoal.
          </p>
        </div>

        {/* O que significa MAEXTRIA */}
        <Card className="mb-16 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">O que significa MAEXTRIA?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">MA</div>
                <h3 className="text-xl font-semibold mb-2">Mente e Origem</h3>
                <p className="text-muted-foreground">
                  Representa a origem do conhecimento, onde tudo começa: na mente audaz que busca crescer.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">EX</div>
                <h3 className="text-xl font-semibold mb-2">Impulso que Eleva</h3>
                <p className="text-muted-foreground">
                  O movimento exponencial que transforma aprendizado em ação e expande resultados.
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-3">TRIA</div>
                <h3 className="text-xl font-semibold mb-2">A Tríade Completa</h3>
                <p className="text-muted-foreground">
                  Saber, Fazer e Ser — o ciclo completo da evolução humana através da educação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Missão, Visão e Valores */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Missão</h3>
              <p className="text-muted-foreground">
                Democratizar o conhecimento de qualidade, tornando a educação acessível a todos que buscam crescimento pessoal e profissional.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Visão</h3>
              <p className="text-muted-foreground">
                Formar mentes exponenciais que transformam conhecimento em ação e impacto positivo no mundo.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Valores</h3>
              <p className="text-muted-foreground">
                Aprendizado contínuo, aplicação prática do conhecimento e expansão de resultados através da excelência.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* A Tríade */}
        <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">A Tríade da Evolução</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2">1. Aprender</h3>
                <p className="text-muted-foreground">
                  Absorver conhecimento de qualidade, com metodologia moderna e conteúdo relevante para o mundo real.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2">2. Aplicar</h3>
                <p className="text-muted-foreground">
                  Colocar em prática o que foi aprendido, transformando teoria em experiência concreta e resultados tangíveis.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary mb-2">3. Expandir</h3>
                <p className="text-muted-foreground">
                  Crescer exponencialmente, multiplicando conhecimento, habilidades e impacto no mundo ao seu redor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
