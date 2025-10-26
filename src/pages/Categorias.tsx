import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, Briefcase, Code, Heart, Utensils, Camera, Music } from "lucide-react";

const categoryIcons: Record<string, any> = {
  "Tecnologia": Code,
  "Negócios": Briefcase,
  "Educação": GraduationCap,
  "Saúde": Heart,
  "Culinária": Utensils,
  "Fotografia": Camera,
  "Música": Music,
  "default": BookOpen
};

export default function Categorias() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Array<{ categoria: string; count: number }>>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("cursos")
      .select("categoria")
      .eq("ativo", true);

    if (!error && data) {
      // Group by category and count
      const categoryMap = new Map<string, number>();
      data.forEach((curso) => {
        if (curso.categoria) {
          categoryMap.set(curso.categoria, (categoryMap.get(curso.categoria) || 0) + 1);
        }
      });

      const categoryList = Array.from(categoryMap.entries()).map(([categoria, count]) => ({
        categoria,
        count,
      }));

      setCategories(categoryList);
    }
  };

  const handleCategoryClick = (categoria: string) => {
    navigate(`/cursos?categoria=${encodeURIComponent(categoria)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Explore por <span className="text-primary">Categoria</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Encontre o curso perfeito para sua jornada de aprendizado
          </p>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p>Nenhuma categoria disponível no momento.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map(({ categoria, count }) => {
              const IconComponent = categoryIcons[categoria] || categoryIcons.default;
              return (
                <Card
                  key={categoria}
                  className="bg-card hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer group"
                  onClick={() => handleCategoryClick(categoria)}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{categoria}</h3>
                    <p className="text-muted-foreground">
                      {count} {count === 1 ? "curso" : "cursos"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Não encontrou o que procura?</h2>
              <p className="text-muted-foreground mb-6">
                Navegue por todos os nossos cursos disponíveis
              </p>
              <button
                onClick={() => navigate("/cursos")}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Ver Todos os Cursos
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
