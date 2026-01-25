import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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

interface Modulo {
  id: string;
  titulo_modulo: string;
  ordem: number;
  video_url: string | null;
}

export default function ModulosManager() {
  const { cursoId } = useParams();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [curso, setCurso] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    const [cursoRes, modulosRes] = await Promise.all([
      supabase.from("cursos").select("titulo").eq("id", cursoId).single(),
      supabase
        .from("modulos")
        .select("id, titulo_modulo, ordem, video_url")
        .eq("curso_id", cursoId)
        .order("ordem"),
    ]);

    if (cursoRes.data) setCurso(cursoRes.data);
    if (modulosRes.data) setModulos(modulosRes.data);
  };

  const deleteModulo = async (id: string) => {
    const { error } = await supabase.from("modulos").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir módulo",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Módulo excluído com sucesso" });
      fetchData();
    }
  };

  const moveModulo = async (index: number, direction: "up" | "down") => {
    const newModulos = [...modulos];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newModulos.length) return;

    [newModulos[index], newModulos[targetIndex]] = [
      newModulos[targetIndex],
      newModulos[index],
    ];

    // Atualizar ordens
    const updates = newModulos.map((mod, idx) => ({
      id: mod.id,
      ordem: idx + 1,
    }));

    for (const update of updates) {
      await supabase
        .from("modulos")
        .update({ ordem: update.ordem })
        .eq("id", update.id);
    }

    fetchData();
    toast({ title: "Ordem atualizada com sucesso" });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">
          <Link to="/admin/cursos" className="hover:underline">
            Cursos
          </Link>{" "}
          / {curso?.titulo}
        </p>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Módulos</h1>
            <p className="text-muted-foreground">
              Adicione vídeos e conteúdo de texto para cada módulo
            </p>
          </div>
          <Link to={`/admin/cursos/${cursoId}/modulos/novo`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {modulos.map((modulo, index) => (
          <Card key={modulo.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Módulo {modulo.ordem}: {modulo.titulo_modulo}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {modulo.video_url ? "✓ Vídeo configurado" : "⚠ Sem vídeo"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveModulo(index, "up")}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveModulo(index, "down")}
                    disabled={index === modulos.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link to={`/admin/modulos/${modulo.id}/aulas`}>
                  <Button variant="default" size="sm">
                    Gerenciar Aulas
                  </Button>
                </Link>
                <Link to={`/admin/modulos/${modulo.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
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
                        Tem certeza que deseja excluir este módulo?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteModulo(modulo.id)}>
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
