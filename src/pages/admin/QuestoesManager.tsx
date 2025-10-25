import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";
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

interface Questao {
  id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  correta: string;
}

export default function QuestoesManager() {
  const { cursoId } = useParams();
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [curso, setCurso] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    const [cursoRes, questoesRes] = await Promise.all([
      supabase.from("cursos").select("titulo").eq("id", cursoId).single(),
      supabase
        .from("prova_questoes")
        .select("*")
        .eq("curso_id", cursoId)
        .order("enunciado"),
    ]);

    if (cursoRes.data) setCurso(cursoRes.data);
    if (questoesRes.data) setQuestoes(questoesRes.data);
  };

  const deleteQuestao = async (id: string) => {
    const { error } = await supabase.from("prova_questoes").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir questão",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Questão excluída com sucesso" });
      fetchData();
    }
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
            <h1 className="text-3xl font-bold mb-2">Gerenciar Prova</h1>
            <p className="text-muted-foreground">
              Adicione e edite questões da prova do curso
            </p>
          </div>
          <Link to={`/admin/cursos/${cursoId}/questoes/nova`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Questão
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {questoes.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma questão cadastrada. Adicione a primeira questão para este curso.
            </CardContent>
          </Card>
        )}

        {questoes.map((questao, index) => (
          <Card key={questao.id}>
            <CardHeader>
              <CardTitle className="text-lg">Questão {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">{questao.enunciado}</p>
                <div className="grid grid-cols-1 gap-2 text-sm ml-4">
                  <p className={questao.correta === "a" ? "font-semibold text-green-600" : ""}>
                    A) {questao.alternativa_a}
                  </p>
                  <p className={questao.correta === "b" ? "font-semibold text-green-600" : ""}>
                    B) {questao.alternativa_b}
                  </p>
                  <p className={questao.correta === "c" ? "font-semibold text-green-600" : ""}>
                    C) {questao.alternativa_c}
                  </p>
                  <p className={questao.correta === "d" ? "font-semibold text-green-600" : ""}>
                    D) {questao.alternativa_d}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link to={`/admin/questoes/${questao.id}/editar`}>
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
                        Tem certeza que deseja excluir esta questão?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteQuestao(questao.id)}>
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
