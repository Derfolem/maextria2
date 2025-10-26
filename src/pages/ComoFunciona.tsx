import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Award, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ComoFunciona() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Como <span className="text-primary">Funciona</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Um processo simples e transparente para sua evolução educacional
          </p>
        </div>

        {/* Passo a passo */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Escolha seu curso</h3>
              <p className="text-muted-foreground">
                Navegue por nossa biblioteca de cursos gratuitos e escolha o que mais combina com seus objetivos.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Estude no seu ritmo</h3>
              <p className="text-muted-foreground">
                Acesse todo o conteúdo gratuitamente. Aprenda quando e onde quiser, sem pressa.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Faça a avaliação</h3>
              <p className="text-muted-foreground">
                Complete os módulos e realize a prova final. É necessário 60% de acertos para aprovação.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card hover:shadow-lg transition-shadow">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-primary">4</span>
              </div>
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-3">Emita seu certificado</h3>
              <p className="text-muted-foreground">
                Sendo aprovado, solicite seu certificado digital válido em todo território nacional.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Perguntas Frequentes */}
        <Card className="mb-16 bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Perguntas Frequentes</h2>
            <div className="space-y-6 max-w-3xl mx-auto">
              <div>
                <h3 className="text-xl font-bold mb-2">Os cursos são realmente gratuitos?</h3>
                <p className="text-muted-foreground">
                  Sim! Todo o conteúdo dos cursos é 100% gratuito. Você só paga se desejar emitir o certificado digital.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2">Os certificados são válidos?</h3>
                <p className="text-muted-foreground">
                  Sim! Nossos certificados são digitais, possuem código de validação único e são válidos em todo o Brasil como cursos livres.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Preciso fazer a prova obrigatoriamente?</h3>
                <p className="text-muted-foreground">
                  Não, mas a aprovação na prova é necessária para emitir o certificado. Se você está estudando apenas por conhecimento, pode pular essa etapa.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Quanto custa o certificado?</h3>
                <p className="text-muted-foreground">
                  O valor do certificado varia de acordo com a carga horária do curso e será informado na página de emissão após a aprovação na prova.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Posso fazer quantos cursos quiser?</h3>
                <p className="text-muted-foreground">
                  Sim! Não há limite. Você pode se matricular e concluir quantos cursos desejar, todos gratuitamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a milhares de alunos que já estão transformando suas vidas através da educação.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/cursos")}
            className="bg-primary hover:bg-primary/90 font-semibold text-lg px-8 py-6"
          >
            Ver Cursos Disponíveis
          </Button>
        </div>
      </div>
    </div>
  );
}
