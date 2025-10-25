import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Course {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  carga_horaria_horas: number;
  imagem_capa_url: string;
}

const Cursos = () => {
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
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Cursos Gratuitos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Escolha um curso e comece a aprender agora mesmo. 100% gratuito.
          </p>
        </div>

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
    </div>
  );
};

export default Cursos;
