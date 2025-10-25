import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, BookOpen, FileQuestion } from "lucide-react";
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
    } else {
      setCursos(data || []);
    }
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
                    Slug: {curso.slug} • Carga: {curso.carga_horaria_horas || 0}h
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
