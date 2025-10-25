import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { CheckCircle2, BookOpen, Award, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-background.jpg";

interface Course {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  carga_horaria_horas: number;
  imagem_capa_url: string;
}

const Home = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("cursos")
        .select("*")
        .eq("ativo", true);

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
      <section 
        className="relative pt-32 pb-20 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(108, 99, 255, 0.9), rgba(0, 201, 167, 0.8)), url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Aprenda de graça.<br />Evolua sempre.
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Cursos 100% gratuitos, com certificado válido e personalizável.
          </p>
          <Link to="/cursos">
            <Button 
              variant="secondary" 
              size="xl"
              className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300"
            >
              Ver cursos gratuitos
            </Button>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: BookOpen, title: "1. Faça o curso grátis", desc: "Acesse todo o conteúdo sem custo" },
              { icon: CheckCircle2, title: "2. Conclua e passe na prova", desc: "Complete os módulos e faça a avaliação" },
              { icon: Award, title: "3. Gere seu certificado", desc: "Certificado profissional válido" }
            ].map((step, i) => (
              <Card key={i} className="text-center hover:shadow-lg transition-all hover:scale-105">
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{step.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Cursos em destaque</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link key={course.id} to={`/curso/${course.slug}`}>
                <Card className="h-full hover:shadow-xl transition-all hover:scale-105 overflow-hidden group">
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
                    <img 
                      src={course.imagem_capa_url} 
                      alt={course.titulo}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{course.titulo}</CardTitle>
                    <CardDescription className="text-base">{course.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{course.carga_horaria_horas}h de conteúdo</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Evolui Cursos
              </h3>
              <p className="text-muted-foreground">Aprenda de graça. Evolua sempre.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/cursos" className="hover:text-primary transition-colors">Cursos</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <p className="text-muted-foreground">contato@evoluicursos.com</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>© 2025 Evolui Cursos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
