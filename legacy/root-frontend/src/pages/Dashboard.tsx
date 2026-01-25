import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Award, BookOpen, CheckCircle2, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CourseProgress {
  curso_id: string;
  titulo: string;
  slug: string;
  total_modulos: number;
  modulos_concluidos: number;
  progresso: number;
}

interface ExamResult {
  curso_id: string;
  titulo: string;
  percentual: number;
  aprovado: boolean;
  realizado_em: string;
  certificado?: {
    id: string;
    pago: boolean;
    codigo_validacao: string;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Check if user is admin
        const { data: adminData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!adminData);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Check if user is admin
        const { data: adminData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single();
        
        setIsAdmin(!!adminData);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      // Fetch enrolled courses
      const { data: matriculasData } = await supabase
        .from("matriculas")
        .select(`
          curso_id,
          cursos!inner(id, titulo, slug)
        `)
        .eq("usuario_id", user.id)
        .eq("ativa", true);

      if (matriculasData && matriculasData.length > 0) {
        const cursoIds = matriculasData.map((m: any) => m.curso_id);

        // Fetch progress for enrolled courses
        const { data: progressData } = await supabase
          .from("progresso_modulo")
          .select(`
            modulo_id,
            concluido,
            modulos!inner(curso_id)
          `)
          .eq("usuario_id", user.id);

        const progressByCourse = new Map<string, number>();
        progressData?.forEach((p: any) => {
          const cursoId = p.modulos.curso_id;
          if (cursoIds.includes(cursoId) && p.concluido) {
            progressByCourse.set(cursoId, (progressByCourse.get(cursoId) || 0) + 1);
          }
        });

        const progressArray: CourseProgress[] = [];
        
        for (const matricula of matriculasData) {
          const course = (matricula as any).cursos;
          
          const { data: modulesData } = await supabase
            .from("modulos")
            .select("id")
            .eq("curso_id", course.id);

          const totalModulos = modulesData?.length || 0;
          const modulosConcluidos = progressByCourse.get(course.id) || 0;
          
          progressArray.push({
            curso_id: course.id,
            titulo: course.titulo,
            slug: course.slug,
            total_modulos: totalModulos,
            modulos_concluidos: modulosConcluidos,
            progresso: totalModulos > 0 ? (modulosConcluidos / totalModulos) * 100 : 0,
          });
        }

        setCoursesProgress(progressArray);
      }

      // Fetch exam results
      const { data: resultsData } = await supabase
        .from("prova_resultado")
        .select(`
          *,
          cursos(titulo)
        `)
        .eq("usuario_id", user.id);

      if (resultsData) {
        // Buscar certificados para os cursos aprovados
        const { data: certificadosData } = await supabase
          .from("certificados")
          .select("*")
          .eq("usuario_id", user.id);

        const certificadosMap = new Map(
          certificadosData?.map(cert => [cert.curso_id, cert]) || []
        );

        setExamResults(
          resultsData.map((r: any) => ({
            curso_id: r.curso_id,
            titulo: r.cursos.titulo,
            percentual: r.percentual,
            aprovado: r.aprovado,
            realizado_em: r.realizado_em,
            certificado: certificadosMap.get(r.curso_id) || null,
          }))
        );
      }
    };

    fetchProgress();
  }, [user]);

  const handleDownloadCertificate = async (cursoId: string, certificadoId: string, tituloCurso: string) => {
    setDownloadingCertId(certificadoId);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Você precisa estar autenticado");

      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { 
          cursoId,
          certificadoId 
        },
      });

      if (error) {
        // Tratamento de erros específicos
        if (error.message?.includes("não passou na prova") || error.message?.includes("60%")) {
          toast({
            title: "⚠️ Aprovação necessária",
            description: "Você precisa de pelo menos 60% de acerto na prova final para emitir o certificado.",
            variant: "destructive",
          });
        } else if (error.message?.includes("pagamento") || error.message?.includes("pago")) {
          toast({
            title: "⚠️ Pagamento pendente",
            description: "Você precisa confirmar o pagamento do certificado antes de fazer o download.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "⚠️ Erro ao gerar certificado",
            description: error.message || "Não foi possível gerar o certificado agora. Tente novamente.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.pdf) {
        const link = document.createElement("a");
        link.href = data.pdf;
        link.download = `certificado-${tituloCurso.replace(/\s+/g, "-").toLowerCase()}.pdf`;
        link.click();

        toast({
          title: "✅ Certificado gerado com sucesso!",
          description: "Seu certificado está sendo baixado.",
        });
      } else {
        throw new Error("PDF não retornado");
      }
    } catch (error: any) {
      toast({
        title: "⚠️ Erro técnico",
        description: "Não foi possível gerar o certificado agora. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleDeleteCourse = async (cursoId: string) => {
    try {
      // Check if user has a paid certificate for this course
      const { data: certificado } = await supabase
        .from("certificados")
        .select("pago")
        .eq("usuario_id", user.id)
        .eq("curso_id", cursoId)
        .eq("pago", true)
        .maybeSingle();

      if (certificado) {
        toast({
          title: "Não é possível excluir",
          description: "Você já pagou pelo certificado deste curso",
          variant: "destructive",
        });
        return;
      }

      // First, get all module IDs for this course
      const { data: modules } = await supabase
        .from("modulos")
        .select("id")
        .eq("curso_id", cursoId);

      // Delete progress records for these modules
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        await supabase
          .from("progresso_modulo")
          .delete()
          .eq("usuario_id", user.id)
          .in("modulo_id", moduleIds);
      }

      // Delete enrollment
      const { error } = await supabase
        .from("matriculas")
        .delete()
        .eq("curso_id", cursoId)
        .eq("usuario_id", user.id);

      if (error) throw error;

      toast({
        title: "Curso removido",
        description: "O curso foi removido do seu painel.",
      });

      // Reload page to refresh data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao remover curso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Meu Painel</h1>
          <p className="text-lg text-muted-foreground">
            Bem-vindo de volta, {user?.user_metadata?.nome_completo || "estudante"}!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Courses in Progress */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Meus Cursos
            </h2>
            
            {coursesProgress.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não está matriculado em nenhum curso.
                  </p>
                  <Button variant="hero" onClick={() => navigate("/cursos")}>
                    Ver cursos disponíveis
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {coursesProgress.map((course) => (
                  <Card key={course.curso_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{course.titulo}</CardTitle>
                      <CardDescription>
                        {course.modulos_concluidos} de {course.total_modulos} módulos concluídos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Progress value={course.progresso} className="mb-4" />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => navigate(`/curso/${course.slug}`)}
                        >
                          Continuar curso
                        </Button>
                        {isAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover curso</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover este curso do seu painel? 
                                  Seu progresso será perdido.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCourse(course.curso_id)}>
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Exam Results */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-secondary" />
              Resultados das provas
            </h2>
            
            {examResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma prova realizada ainda.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {examResults.map((result) => (
                  <Card key={result.curso_id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {result.titulo}
                        {result.aprovado && (
                          <CheckCircle2 className="h-5 w-5 text-secondary" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Realizada em {new Date(result.realizado_em).toLocaleDateString("pt-BR")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-foreground">Nota</span>
                          <span className={`font-bold text-lg ${result.aprovado ? "text-primary" : "text-destructive"}`}>
                            {result.percentual.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-foreground">Status</span>
                          <span className={`font-semibold ${result.aprovado ? "text-primary" : "text-destructive"}`}>
                            {result.aprovado ? "Aprovado" : "Reprovado"}
                          </span>
                        </div>
                        {result.aprovado && (
                          <>
                            {result.certificado?.pago ? (
                              <div className="mt-4 space-y-3">
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                  <p className="text-sm font-semibold text-primary mb-1">
                                    ✓ Certificado Emitido
                                  </p>
                                  <p className="text-xs text-foreground/70">
                                    Código: {result.certificado.codigo_validacao}
                                  </p>
                                </div>
                                <Button 
                                  variant="outline"
                                  className="w-full"
                                  size="sm"
                                  onClick={() => handleDownloadCertificate(
                                    result.curso_id, 
                                    result.certificado!.id, 
                                    result.titulo
                                  )}
                                  disabled={downloadingCertId === result.certificado.id}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  {downloadingCertId === result.certificado.id ? "Gerando..." : "Baixar Certificado"}
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="hero" 
                                className="w-full mt-4"
                                onClick={() => navigate(`/pagamento-certificado/${result.curso_id}`)}
                              >
                                Emitir Certificado
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
