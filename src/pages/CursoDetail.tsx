import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  titulo: string;
  descricao: string;
  carga_horaria_horas: number;
  publico_alvo: string;
  imagem_capa_url: string;
}

interface Module {
  id: string;
  ordem: number;
  titulo_modulo: string;
  concluido?: boolean;
}

const CursoDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [user, setUser] = useState<any>(null);
  const [allModulesCompleted, setAllModulesCompleted] = useState(false);
  const [examTaken, setExamTaken] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data: courseData } = await supabase
        .from("cursos")
        .select("*")
        .eq("slug", slug)
        .single();

      if (courseData) {
        setCourse(courseData);

        const { data: modulesData } = await supabase
          .from("modulos")
          .select("*")
          .eq("curso_id", courseData.id)
          .order("ordem");

        if (modulesData && user) {
          const { data: progressData } = await supabase
            .from("progresso_modulo")
            .select("modulo_id, concluido")
            .eq("usuario_id", user.id);

          const progressMap = new Map(
            progressData?.map((p) => [p.modulo_id, p.concluido]) || []
          );

          const modulesWithProgress = modulesData.map((m) => ({
            ...m,
            concluido: progressMap.get(m.id) || false,
          }));

          setModules(modulesWithProgress);
          
          const allCompleted = modulesWithProgress.every((m) => m.concluido);
          setAllModulesCompleted(allCompleted);
        } else {
          setModules(modulesData || []);
        }

        // Check if exam was taken
        if (user && courseData) {
          const { data: resultData } = await supabase
            .from("prova_resultado")
            .select("*")
            .eq("usuario_id", user.id)
            .eq("curso_id", courseData.id)
            .maybeSingle();

          setExamTaken(!!resultData);

          // Check if user is enrolled
          const { data: enrollmentData } = await supabase
            .from("matriculas")
            .select("*")
            .eq("usuario_id", user.id)
            .eq("curso_id", courseData.id)
            .eq("ativa", true)
            .maybeSingle();

          setIsEnrolled(!!enrollmentData);
        }
      }
    };

    if (slug) {
      fetchCourse();
    }
  }, [slug, user]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Faça login para se matricular");
      navigate("/auth");
      return;
    }

    if (!course) return;

    setIsEnrolling(true);
    const { error } = await supabase
      .from("matriculas")
      .insert({
        usuario_id: user.id,
        curso_id: course.id,
      });

    if (error) {
      toast.error("Erro ao matricular no curso");
      console.error(error);
    } else {
      toast.success("Matrícula realizada com sucesso!");
      setIsEnrolled(true);
    }
    setIsEnrolling(false);
  };

  const handleStartCourse = () => {
    if (!user) {
      toast.error("Faça login para começar o curso");
      navigate("/auth");
      return;
    }

    if (!isEnrolled) {
      toast.error("Você precisa se matricular primeiro");
      return;
    }

    if (modules.length > 0) {
      const firstIncompleteModule = modules.find((m) => !m.concluido) || modules[0];
      navigate(`/modulo/${course?.id}/${firstIncompleteModule.id}`);
    }
  };

  if (!course) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <div className="aspect-video bg-gradient-to-br from-primary to-secondary rounded-lg overflow-hidden mb-6">
              <img 
                src={course.imagem_capa_url} 
                alt={course.titulo}
                className="w-full h-full object-cover opacity-80"
              />
            </div>
            
            <h1 className="text-4xl font-bold mb-4">{course.titulo}</h1>
            <p className="text-lg text-muted-foreground mb-6">{course.descricao}</p>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Público-alvo</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{course.publico_alvo}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do curso</CardTitle>
                <CardDescription>{modules.length} módulos • {course.carga_horaria_horas}h de conteúdo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {module.concluido ? (
                        <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="flex-1">{module.titulo_modulo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.carga_horaria_horas} horas</span>
                </div>
                <CardTitle>Comece agora</CardTitle>
                <CardDescription>100% gratuito</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isEnrolled ? (
                  <>
                    <Button 
                      variant="hero"
                      className="w-full" 
                      size="lg"
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? "Matriculando..." : "Matricular-se Gratuitamente"}
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Matricule-se para começar a estudar
                    </p>
                  </>
                ) : !examTaken ? (
                  <>
                    <Button 
                      variant={allModulesCompleted ? "default" : "hero"}
                      className="w-full" 
                      size="lg"
                      onClick={allModulesCompleted ? () => navigate(`/prova/${course.id}`) : handleStartCourse}
                    >
                      {allModulesCompleted ? (
                        <>Fazer Prova Final</>
                      ) : (
                        <>
                          <PlayCircle className="h-5 w-5" />
                          {modules.some(m => m.concluido) ? "Continuar curso" : "Iniciar curso"}
                        </>
                      )}
                    </Button>
                    {modules.some(m => m.concluido) && (
                      <Button 
                        variant="outline"
                        className="w-full" 
                        size="lg"
                        onClick={handleStartCourse}
                      >
                        Revisar Aulas
                      </Button>
                    )}
                    {allModulesCompleted && (
                      <p className="text-sm text-center text-muted-foreground">
                        Você completou todos os módulos! Faça a prova para liberar seu certificado.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      variant="secondary"
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate("/dashboard")}
                    >
                      Ver resultado da prova
                    </Button>
                    <p className="text-sm text-center text-muted-foreground">
                      Você já fez a prova deste curso!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CursoDetail;
