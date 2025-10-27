import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Aula {
  id: string;
  titulo: string;
  ordem: number;
  video_url?: string;
}

export default function AulasManager() {
  const { moduloId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [moduloTitulo, setModuloTitulo] = useState("");

  useEffect(() => {
    fetchData();
  }, [moduloId]);

  const fetchData = async () => {
    // Buscar módulo
    const { data: modulo } = await supabase
      .from("modulos")
      .select("titulo_modulo")
      .eq("id", moduloId)
      .single();

    if (modulo) {
      setModuloTitulo(modulo.titulo_modulo);
    }

    // Buscar aulas
    const { data: aulasData } = await supabase
      .from("aulas")
      .select("*")
      .eq("modulo_id", moduloId)
      .order("ordem");

    if (aulasData) {
      setAulas(aulasData);
    }
  };

  const deleteAula = async (id: string) => {
    const { error } = await supabase.from("aulas").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar aula",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Aula deletada com sucesso" });
      fetchData();
    }
  };

  const moveAula = async (index: number, direction: "up" | "down") => {
    const newAulas = [...aulas];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newAulas.length) return;

    [newAulas[index], newAulas[targetIndex]] = [newAulas[targetIndex], newAulas[index]];

    await supabase.from("aulas").update({ ordem: index + 1 }).eq("id", newAulas[index].id);
    await supabase.from("aulas").update({ ordem: targetIndex + 1 }).eq("id", newAulas[targetIndex].id);

    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Aulas do Módulo</h1>
            <p className="text-muted-foreground">{moduloTitulo}</p>
          </div>
          <Button asChild>
            <Link to={`/admin/modulos/${moduloId}/aulas/nova`}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Aula
            </Link>
          </Button>
        </div>

        <div className="grid gap-4">
          {aulas.map((aula, index) => (
            <Card key={aula.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Aula {aula.ordem}: {aula.titulo}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveAula(index, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveAula(index, "down")}
                      disabled={index === aulas.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/modulos/${moduloId}/aulas/${aula.id}/editar`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Aula</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar esta aula? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAula(aula.id)}>
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {aula.video_url && (
                  <p className="text-sm text-muted-foreground">Possui vídeo</p>
                )}
              </CardContent>
            </Card>
          ))}

          {aulas.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma aula cadastrada neste módulo</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
