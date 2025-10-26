import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Award, Zap, ChevronRight, Star, Clock } from "lucide-react";
import heroImage from "@/assets/maextria-hero.jpg";
import conceptImage from "@/assets/maextria-concept.jpg";
import logoImage from "@/assets/maextria-logo.png";

interface Course {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  carga_horaria_horas: number;
  imagem_capa_url: string | null;
  categoria: string | null;
}

const Home = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("ativo", true)
        .limit(6);

      if (!error && data) {
        setCourses(data);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="MAEXTRIA Hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />
          <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
        </div>

        {/* Content */}
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <img 
              src={logoImage} 
              alt="MAEXTRIA" 
              className="w-96 mx-auto mb-8 animate-fade-in"
            />
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight animate-fade-in">
              Mentes Audazes <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Exponencializam
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in font-medium">
              na Tríade: <span className="text-foreground font-bold">Aprender</span>, <span className="text-foreground font-bold">Aplicar</span> e <span className="text-foreground font-bold">Expandir</span>
            </p>

            <p className="text-lg text-muted-foreground animate-fade-in">
              Cursos gratuitos. Certificados válidos. Conhecimento sem limites.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
              <Button 
                asChild 
                size="lg" 
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all"
              >
                <Link to="/cursos">
                  Comece Agora Gratuitamente
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10"
              >
                <Link to="/como-funciona">
                  Saiba Mais
                </Link>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="pt-12 animate-fade-in">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="h-8 w-8 text-primary rotate-90" />
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-black">
                O Ciclo da <br />
                <span className="text-primary">Evolução Humana</span>
              </h2>
              
              <div className="space-y-4 text-lg text-muted-foreground">
                <p>
                  <span className="text-primary font-bold">MA</span> → mente e origem
                </p>
                <p>
                  <span className="text-primary font-bold">EX</span> → impulso que eleva
                </p>
                <p>
                  <span className="text-primary font-bold">TRIA</span> → tríade que completa: saber, fazer e ser
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-xl font-semibold text-foreground">
                  Aprenda no seu ritmo.
                </p>
                <p className="text-xl font-semibold text-foreground">
                  Aplique no mundo real.
                </p>
                <p className="text-xl font-semibold text-foreground">
                  Expanda seus resultados.
                </p>
              </div>

              <p className="text-muted-foreground italic pt-4">
                "Conhecimento é só o começo — transformação é o destino."
              </p>
            </div>

            <div className="relative">
              <img 
                src={conceptImage} 
                alt="Conceito MAEXTRIA" 
                className="rounded-2xl shadow-[var(--shadow-card)]"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Como <span className="text-primary">Funciona</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Três passos simples para transformar sua jornada de aprendizado
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="p-8 bg-card border-border hover:border-primary transition-all hover:shadow-[var(--shadow-soft)] group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Aprender</h3>
              <p className="text-muted-foreground">
                Escolha entre dezenas de cursos gratuitos e aprenda no seu ritmo, com conteúdo de qualidade.
              </p>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary transition-all hover:shadow-[var(--shadow-soft)] group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Aplicar</h3>
              <p className="text-muted-foreground">
                Pratique o conhecimento adquirido e comprove seu aprendizado através de avaliações práticas.
              </p>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary transition-all hover:shadow-[var(--shadow-soft)] group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Expandir</h3>
              <p className="text-muted-foreground">
                Receba seu certificado válido e amplie suas oportunidades profissionais.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Cursos em <span className="text-primary">Destaque</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Transforme aprendizado em conquista
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {courses.map((course) => (
              <Link key={course.id} to={`/curso/${course.slug}`}>
                <Card className="overflow-hidden hover:shadow-[var(--shadow-soft)] transition-all hover:scale-105 bg-card border-border group">
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-background overflow-hidden">
                    {course.imagem_capa_url ? (
                      <img
                        src={course.imagem_capa_url}
                        alt={course.titulo}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-20 w-20 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold">
                      GRATUITO
                    </Badge>
                  </div>
                  
                  <div className="p-6 space-y-3">
                    {course.categoria && (
                      <Badge variant="outline" className="text-xs">
                        {course.categoria}
                      </Badge>
                    )}
                    
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {course.titulo}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.descricao || "Expanda seu conhecimento com este curso completo."}
                    </p>

                    <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-semibold">5.0</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.carga_horaria_horas}h</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
              <Link to="/cursos">
                Ver Todos os Cursos
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-glow)]" />
        <div className="container relative mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-black">
              Domine o seu <span className="text-primary">Crescimento</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              com educação exponencial
            </p>
            <Button 
              asChild 
              size="lg" 
              className="text-lg px-12 py-6 bg-primary hover:bg-primary/90 shadow-[var(--shadow-glow)]"
            >
              <Link to="/cursos">Começar Agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-border py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto">
            <div className="md:col-span-2 space-y-4">
              <img src={logoImage} alt="MAEXTRIA" className="w-48" />
              <p className="text-muted-foreground italic">
                Aprender. Aplicar. Expandir.
              </p>
              <p className="text-sm text-muted-foreground">
                Plataforma de educação exponencial que transforma conhecimento em impacto real.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-foreground">Navegação</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/cursos" className="hover:text-primary transition-colors">Cursos</Link></li>
                <li><Link to="/categorias" className="hover:text-primary transition-colors">Categorias</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Meu Painel</Link></li>
                <li><Link to="/perfil" className="hover:text-primary transition-colors">Perfil</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-foreground">Institucional</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/sobre" className="hover:text-primary transition-colors">Sobre</Link></li>
                <li><Link to="/como-funciona" className="hover:text-primary transition-colors">Como Funciona</Link></li>
                <li><Link to="/cursos" className="hover:text-primary transition-colors">Certificados</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 MAEXTRIA. Todos os direitos reservados.</p>
            <p className="mt-2 font-semibold text-foreground">
              Maextria é a mente que aprende, aplica e expande.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
