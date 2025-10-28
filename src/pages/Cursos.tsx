import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { ShareButton } from "@/components/ShareButton";
import { Clock, Filter, BookOpen } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("categoria") || "";

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (categoryParam) {
      setCategoriaFiltro(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    filterCourses();
  }, [categoriaFiltro, courses, searchTerm]);

  const fetchCourses = async () => {
    const { data: cursosData, error } = await supabase
      .from("cursos")
      .select("id, titulo, slug, descricao, categoria, carga_horaria_horas, imagem_capa_url")
      .eq("ativo", true)
      .order("criado_em", { ascending: false });

    if (!error && cursosData) {
      // Fetch ratings for all courses in a single query
      const cursoIds = cursosData.map(c => c.id);
      const { data: avaliacoesData } = await supabase
        .from("avaliacoes")
        .select("curso_id, nota")
        .in("curso_id", cursoIds);

      // Group ratings by course
      const ratingsByCourse = (avaliacoesData || []).reduce((acc, av) => {
        if (!acc[av.curso_id]) acc[av.curso_id] = [];
        acc[av.curso_id].push(av.nota);
        return acc;
      }, {} as Record<string, number[]>);

      // Calculate ratings for each course
      const coursesWithRatings = cursosData.map((curso) => {
        const ratings = ratingsByCourse[curso.id] || [];
        const totalAvaliacoes = ratings.length;
        const mediaAvaliacoes = totalAvaliacoes > 0
          ? ratings.reduce((sum, nota) => sum + nota, 0) / totalAvaliacoes
          : 0;

        return {
          ...curso,
          media_avaliacoes: mediaAvaliacoes,
          total_avaliacoes: totalAvaliacoes,
        };
      });

      setCourses(coursesWithRatings);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(cursosData.map((c) => c.categoria).filter(Boolean))
      );
      setCategorias(uniqueCategories);
    }
  };

  const filterCourses = () => {
    let filtered = courses;
    
    // Filter by category
    if (categoriaFiltro !== "todas") {
      filtered = filtered.filter((c) => c.categoria === categoriaFiltro);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => 
        c.titulo.toLowerCase().includes(term) ||
        c.descricao?.toLowerCase().includes(term) ||
        c.categoria?.toLowerCase().includes(term)
      );
    }
    
    setFilteredCourses(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4">
            Cursos <span className="text-primary">Gratuitos</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Escolha um curso e comece a aprender agora mesmo. 100% gratuito.
          </p>
          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

                <CardHeader className="flex-grow p-3">
                  <CardTitle className="line-clamp-2 text-sm">{course.titulo}</CardTitle>
                  
                  <div className="flex items-center gap-1 pt-1">
                    <StarRating rating={course.media_avaliacoes} size={12} />
                    {course.total_avaliacoes > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({course.total_avaliacoes})
                      </span>
                    )}
                  </div>

                  {course.carga_horaria_horas > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                      <Clock className="h-3 w-3" />
                      <span>{course.carga_horaria_horas}h</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pt-0 p-3 space-y-2">
                  <div className="flex gap-1">
                    <Button asChild size="sm" className="flex-1 text-xs h-8">
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
