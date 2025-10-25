import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { ShareButton } from "@/components/ShareButton";
import { Clock, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  titulo: string;
  slug: string;
  descricao: string;
  categoria: string;
  carga_horaria_horas: number;
  imagem_capa_url: string;
}

interface CourseWithRating extends Course {
  media_avaliacoes: number;
  total_avaliacoes: number;
}

const Cursos = () => {
  const [courses, setCourses] = useState<CourseWithRating[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithRating[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [categoriaFiltro, courses]);

  const fetchCourses = async () => {
    const { data: cursosData, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("ativo", true);

    if (!error && cursosData) {
      // Fetch ratings for each course
      const coursesWithRatings = await Promise.all(
        cursosData.map(async (curso) => {
          const { data: avaliacoes } = await supabase
            .from("avaliacoes")
            .select("nota")
            .eq("curso_id", curso.id);

          const totalAvaliacoes = avaliacoes?.length || 0;
          const mediaAvaliacoes = totalAvaliacoes > 0
            ? avaliacoes!.reduce((sum, a) => sum + a.nota, 0) / totalAvaliacoes
            : 0;

          return {
            ...curso,
            media_avaliacoes: mediaAvaliacoes,
            total_avaliacoes: totalAvaliacoes,
          };
        })
      );

      setCourses(coursesWithRatings);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(cursosData.map((c) => c.categoria).filter(Boolean))
      );
      setCategorias(uniqueCategories);
    }
  };

  const filterCourses = () => {
    if (categoriaFiltro === "todas") {
      setFilteredCourses(courses);
    } else {
      setFilteredCourses(courses.filter((c) => c.categoria === categoriaFiltro));
    }
  };

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

        {categorias.length > 0 && (
          <div className="mb-8 flex items-center justify-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {categoriaFiltro === "todas"
                ? "Nenhum curso disponível no momento."
                : "Nenhum curso encontrado nesta categoria."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="group hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                {course.imagem_capa_url && (
                  <div className="relative overflow-hidden rounded-t-lg aspect-video">
                    <img
                      src={course.imagem_capa_url}
                      alt={course.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {course.categoria && (
                      <Badge className="absolute top-3 right-3">
                        {course.categoria}
                      </Badge>
                    )}
                  </div>
                )}

                <CardHeader className="flex-grow">
                  <CardTitle className="line-clamp-2">{course.titulo}</CardTitle>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <StarRating rating={course.media_avaliacoes} size={16} />
                    {course.total_avaliacoes > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({course.total_avaliacoes})
                      </span>
                    )}
                  </div>

                  {course.carga_horaria_horas > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                      <Clock className="h-4 w-4" />
                      <span>{course.carga_horaria_horas}h</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link to={`/curso/${course.slug}`}>Ver Curso</Link>
                    </Button>
                    <ShareButton title={course.titulo} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cursos;
