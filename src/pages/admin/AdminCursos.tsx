import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, BookOpen, FileQuestion, Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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

interface Curso {
  id: string;
  titulo: string;
  slug: string;
  ativo: boolean;
  carga_horaria_horas: number | null;
  total_alunos?: number;
}

export default function AdminCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    const { data, error } = await supabase
      .from("cursos")
      .select("id, titulo, slug, ativo, carga_horaria_horas")
      .order("titulo");

    if (error) {
      toast({
        title: "Erro ao carregar cursos",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch matriculas count for each curso
    const cursosComContagem = await Promise.all(
      (data || []).map(async (curso) => {
        const { count } = await supabase
          .from("matriculas")
          .select("*", { count: "exact", head: true })
          .eq("curso_id", curso.id)
          .eq("ativa", true);
        
        return { ...curso, total_alunos: count || 0 };
      })
    );

    setCursos(cursosComContagem);
  };

  const toggleAtivo = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("cursos")
      .update({ ativo: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status atualizado com sucesso" });
      fetchCursos();
    }
  };

  const deleteCurso = async (id: string) => {
    const { error } = await supabase.from("cursos").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir curso",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Curso excluído com sucesso" });
      fetchCursos();
    }
  };

  const duplicateCurso = async (id: string) => {
    try {
      // Usar o service role key para operações admin
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado como administrador",
          variant: "destructive",
        });
        return;
      }

      // Buscar dados do curso original
      const { data: cursoOriginal, error: fetchError } = await supabase
        .from("cursos")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError || !cursoOriginal) {
        toast({
          title: "Erro ao buscar curso",
          description: fetchError?.message,
          variant: "destructive",
        });
        return;
      }

      // Criar cópia do curso
      const { data: novoCurso, error: insertError } = await supabase
        .from("cursos")
        .insert({
          titulo: `${cursoOriginal.titulo} (Cópia)`,
          slug: `${cursoOriginal.slug}-copia-${Date.now()}`,
          descricao: cursoOriginal.descricao,
          carga_horaria_horas: cursoOriginal.carga_horaria_horas,
          publico_alvo: cursoOriginal.publico_alvo,
          imagem_capa_url: cursoOriginal.imagem_capa_url,
          categoria: cursoOriginal.categoria,
          preco_certificado: cursoOriginal.preco_certificado,
          ativo: false, // Deixar inativo por padrão
        })
        .select()
        .single();

      if (insertError || !novoCurso) {
        toast({
          title: "Erro ao duplicar curso",
          description: insertError?.message,
          variant: "destructive",
        });
        return;
      }

      // Buscar e duplicar módulos
      const { data: modulos, error: modulosError } = await supabase
        .from("modulos")
        .select("*")
        .eq("curso_id", id)
        .order("ordem");

      if (modulosError) {
        console.error("Erro ao buscar módulos:", modulosError);
      } else if (modulos && modulos.length > 0) {
        const modulosCopia = modulos.map(m => ({
          curso_id: novoCurso.id,
          ordem: m.ordem,
          titulo_modulo: m.titulo_modulo,
          conteudo_texto_html: m.conteudo_texto_html,
          video_url: m.video_url,
        }));

        const { error: insertModulosError } = await supabase
          .from("modulos")
          .insert(modulosCopia);
        
        if (insertModulosError) {
          console.error("Erro ao duplicar módulos:", insertModulosError);
        }
      }

      // Buscar e duplicar questões da prova
      const { data: questoes, error: questoesError } = await supabase
        .from("prova_questoes")
        .select("*")
        .eq("curso_id", id);

      if (questoesError) {
        console.error("Erro ao buscar questões:", questoesError);
      } else if (questoes && questoes.length > 0) {
        const questoesCopia = questoes.map(q => ({
          curso_id: novoCurso.id,
          enunciado: q.enunciado,
          alternativa_a: q.alternativa_a,
          alternativa_b: q.alternativa_b,
          alternativa_c: q.alternativa_c,
          alternativa_d: q.alternativa_d,
          correta: q.correta,
        }));

        const { error: insertQuestoesError } = await supabase
          .from("prova_questoes")
          .insert(questoesCopia);
        
        if (insertQuestoesError) {
          console.error("Erro ao duplicar questões:", insertQuestoesError);
        }
      }

      toast({ 
        title: "Curso duplicado com sucesso!",
        description: "O novo curso foi criado como inativo. Edite-o antes de ativar."
      });
      fetchCursos();
    } catch (error: any) {
      console.error("Erro ao duplicar curso:", error);
      toast({
        title: "Erro ao duplicar curso",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Cursos</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova cursos</p>
        </div>
        <Link to="/admin/cursos/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {cursos.map((curso) => (
          <Card key={curso.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="mb-1">{curso.titulo}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Slug: {curso.slug} • Carga: {curso.carga_horaria_horas || 0}h • Alunos: {curso.total_alunos || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {curso.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={curso.ativo}
                    onCheckedChange={() => toggleAtivo(curso.id, curso.ativo)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/cursos/${curso.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Link to={`/admin/cursos/${curso.id}/modulos`}>
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Módulos
                  </Button>
                </Link>
                <Link to={`/admin/cursos/${curso.id}/prova`}>
                  <Button variant="outline" size="sm">
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Prova
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => duplicateCurso(curso.id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCurso(curso.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
