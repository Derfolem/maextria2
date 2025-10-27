import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Module {
  id: string;
  curso_id: string;
  ordem: number;
  titulo_modulo: string;
  conteudo_texto_html: string;
  video_url: string | null;
}

const ModuloViewer = () => {
  const { cursoId, moduloId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [courseSlug, setCourseSlug] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        toast.error("Faça login para acessar o curso");
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const fetchModule = async () => {
      // Fetch current module
      const { data: moduleData } = await supabase
        .from("modulos")
        .select("*")
        .eq("id", moduloId)
        .single();

      if (moduleData) {
        setModule(moduleData);

        // Fetch course slug
        const { data: courseData } = await supabase
          .from("cursos")
          .select("slug")
          .eq("id", cursoId)
          .single();
        
        if (courseData) {
          setCourseSlug(courseData.slug);
        }

        // Fetch all modules for navigation
        const { data: allModulesData } = await supabase
          .from("modulos")
          .select("*")
          .eq("curso_id", cursoId)
          .order("ordem");

        if (allModulesData) {
          setAllModules(allModulesData);
        }

        // Check if completed
        if (user) {
          const { data: progressData } = await supabase
            .from("progresso_modulo")
            .select("concluido")
            .eq("usuario_id", user.id)
            .eq("modulo_id", moduloId)
            .maybeSingle();

          setIsCompleted(progressData?.concluido || false);
        }
      }
    };

    if (moduloId && cursoId && user) {
      fetchModule();
    }
  }, [moduloId, cursoId, user]);

  const handleMarkComplete = async () => {
    if (!user || !moduloId) return;

    const { error } = await supabase
      .from("progresso_modulo")
      .upsert({
        usuario_id: user.id,
        modulo_id: moduloId,
        concluido: true,
        concluido_em: new Date().toISOString(),
      }, { onConflict: "usuario_id,modulo_id" });

    if (error) {
      toast.error("Erro ao marcar módulo como concluído");
    } else {
      setIsCompleted(true);
      toast.success("Módulo concluído!");
    }
  };

  const handleNextModule = () => {
    if (!module) return;
    
    const currentIndex = allModules.findIndex((m) => m.id === module.id);
    if (currentIndex < allModules.length - 1) {
      const nextModule = allModules[currentIndex + 1];
      navigate(`/modulo/${cursoId}/${nextModule.id}`);
    } else {
      toast.success("Você completou todos os módulos!");
      navigate(`/curso/${courseSlug}`);
    }
  };

  const handlePrevModule = () => {
    if (!module) return;
    
    const currentIndex = allModules.findIndex((m) => m.id === module.id);
    if (currentIndex > 0) {
      const prevModule = allModules[currentIndex - 1];
      navigate(`/modulo/${cursoId}/${prevModule.id}`);
    }
  };

  if (!module) {
    return <div>Carregando...</div>;
  }

  const currentIndex = allModules.findIndex((m) => m.id === module.id);
  const isFirstModule = currentIndex === 0;
  const isLastModule = currentIndex === allModules.length - 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/curso/${courseSlug}`)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar ao curso
          </Button>
        </div>

        <h1 className="text-4xl font-bold mb-2">{module.titulo_modulo}</h1>
        <p className="text-muted-foreground mb-8">
          Módulo {module.ordem} de {allModules.length}
        </p>

        {module.video_url && (
          <div className="aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
            <iframe
              src={module.video_url.includes('youtube.com') || module.video_url.includes('youtu.be') 
                ? module.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                : module.video_url}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={module.titulo_modulo}
            />
          </div>
        )}

        <Card>
          <CardContent className="pt-6 prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: module.conteudo_texto_html || "" }} />
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevModule}
            disabled={isFirstModule}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Módulo anterior
          </Button>

          <div className="flex items-center gap-4">
            {!isCompleted && (
              <Button variant="secondary" onClick={handleMarkComplete}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Marcar como concluído
              </Button>
            )}
            
            <Button
              variant="hero"
              onClick={handleNextModule}
            >
              {isLastModule ? "Finalizar curso" : "Próximo módulo"}
              {!isLastModule && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuloViewer;
