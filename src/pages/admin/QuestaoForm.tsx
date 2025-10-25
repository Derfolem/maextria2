import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { questaoSchema } from "@/lib/schemas";
import { Loader2 } from "lucide-react";

export default function QuestaoForm() {
  const { questaoId, cursoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    enunciado: "",
    alternativa_a: "",
    alternativa_b: "",
    alternativa_c: "",
    alternativa_d: "",
    correta: "",
    curso_id: cursoId || searchParams.get("cursoId") || "",
  });

  const isEditMode = !!questaoId;

  useEffect(() => {
    if (questaoId) {
      fetchQuestao();
    }
  }, [questaoId]);

  const fetchQuestao = async () => {
    const { data, error } = await supabase
      .from("prova_questoes")
      .select("*")
      .eq("id", questaoId)
      .single();

    if (error) {
      toast({
        title: "Erro ao carregar questão",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        enunciado: data.enunciado,
        alternativa_a: data.alternativa_a,
        alternativa_b: data.alternativa_b,
        alternativa_c: data.alternativa_c,
        alternativa_d: data.alternativa_d,
        correta: data.correta,
        curso_id: data.curso_id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = questaoSchema.parse(formData);

      if (isEditMode) {
        const { error } = await supabase
          .from("prova_questoes")
          .update({
            enunciado: validatedData.enunciado,
            alternativa_a: validatedData.alternativa_a,
            alternativa_b: validatedData.alternativa_b,
            alternativa_c: validatedData.alternativa_c,
            alternativa_d: validatedData.alternativa_d,
            correta: validatedData.correta,
          })
          .eq("id", questaoId);

        if (error) throw error;
        toast({ title: "Questão atualizada com sucesso" });
      } else {
        const { error } = await supabase.from("prova_questoes").insert([{
          enunciado: validatedData.enunciado,
          alternativa_a: validatedData.alternativa_a,
          alternativa_b: validatedData.alternativa_b,
          alternativa_c: validatedData.alternativa_c,
          alternativa_d: validatedData.alternativa_d,
          correta: validatedData.correta,
          curso_id: validatedData.curso_id,
        }]);

        if (error) throw error;
        toast({ title: "Questão criada com sucesso" });
      }

      navigate(`/admin/cursos/${formData.curso_id}/prova`);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar questão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? "Editar Questão" : "Nova Questão"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="enunciado">Enunciado *</Label>
              <Textarea
                id="enunciado"
                value={formData.enunciado}
                onChange={(e) =>
                  setFormData({ ...formData, enunciado: e.target.value })
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Alternativas *</Label>
              
              <div className="space-y-2">
                <Label htmlFor="alternativa_a" className="text-sm">A)</Label>
                <Input
                  id="alternativa_a"
                  value={formData.alternativa_a}
                  onChange={(e) =>
                    setFormData({ ...formData, alternativa_a: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternativa_b" className="text-sm">B)</Label>
                <Input
                  id="alternativa_b"
                  value={formData.alternativa_b}
                  onChange={(e) =>
                    setFormData({ ...formData, alternativa_b: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternativa_c" className="text-sm">C)</Label>
                <Input
                  id="alternativa_c"
                  value={formData.alternativa_c}
                  onChange={(e) =>
                    setFormData({ ...formData, alternativa_c: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternativa_d" className="text-sm">D)</Label>
                <Input
                  id="alternativa_d"
                  value={formData.alternativa_d}
                  onChange={(e) =>
                    setFormData({ ...formData, alternativa_d: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="correta">Resposta Correta *</Label>
              <Select
                value={formData.correta}
                onValueChange={(value) =>
                  setFormData({ ...formData, correta: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a resposta correta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="d">D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Atualizar" : "Criar"} Questão
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/cursos/${formData.curso_id}/prova`)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
