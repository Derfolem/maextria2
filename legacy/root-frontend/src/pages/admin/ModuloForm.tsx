import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { moduloSchema } from "@/lib/schemas";
import { Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function ModuloForm() {
  const { moduloId, cursoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo_modulo: "",
    ordem: 1,
    video_url: "",
    conteudo_texto_html: "",
    curso_id: cursoId || searchParams.get("cursoId") || "",
  });

  const isEditMode = !!moduloId;

  useEffect(() => {
    if (moduloId) {
      fetchModulo();
    } else {
      fetchNextOrdem();
    }
  }, [moduloId]);

  const fetchModulo = async () => {
    const { data, error } = await supabase
      .from("modulos")
      .select("*")
      .eq("id", moduloId)
      .single();

    if (error) {
      toast({
        title: "Erro ao carregar módulo",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        titulo_modulo: data.titulo_modulo,
        ordem: data.ordem,
        video_url: data.video_url || "",
        conteudo_texto_html: data.conteudo_texto_html || "",
        curso_id: data.curso_id,
      });
    }
  };

  const fetchNextOrdem = async () => {
    const { count } = await supabase
      .from("modulos")
      .select("*", { count: "exact", head: true })
      .eq("curso_id", formData.curso_id);

    setFormData((prev) => ({ ...prev, ordem: (count || 0) + 1 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = moduloSchema.parse(formData);

      if (isEditMode) {
        const { error } = await supabase
          .from("modulos")
          .update({
            titulo_modulo: validatedData.titulo_modulo,
            ordem: validatedData.ordem,
            video_url: validatedData.video_url || null,
            conteudo_texto_html: validatedData.conteudo_texto_html || null,
          })
          .eq("id", moduloId);

        if (error) throw error;
        toast({ title: "Módulo atualizado com sucesso" });
      } else {
        const { error } = await supabase.from("modulos").insert([{
          titulo_modulo: validatedData.titulo_modulo,
          ordem: validatedData.ordem,
          video_url: validatedData.video_url || null,
          conteudo_texto_html: validatedData.conteudo_texto_html || null,
          curso_id: validatedData.curso_id,
        }]);

        if (error) throw error;
        toast({ title: "Módulo criado com sucesso" });
      }

      navigate(`/admin/cursos/${formData.curso_id}/modulos`);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar módulo",
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
            {isEditMode ? "Editar Módulo" : "Novo Módulo"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo_modulo">Título do Módulo *</Label>
              <Input
                id="titulo_modulo"
                value={formData.titulo_modulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo_modulo: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem *</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                value={formData.ordem}
                onChange={(e) =>
                  setFormData({ ...formData, ordem: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL do Vídeo</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) =>
                  setFormData({ ...formData, video_url: e.target.value })
                }
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">
                Cole a URL do YouTube, Vimeo ou outro serviço de vídeo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conteudo_texto_html">Conteúdo de Texto da Aula</Label>
              <RichTextEditor
                value={formData.conteudo_texto_html}
                onChange={(value) =>
                  setFormData({ ...formData, conteudo_texto_html: value })
                }
                placeholder="Escreva o conteúdo da aula aqui. Use a barra de ferramentas para formatação e inserir imagens..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Atualizar" : "Criar"} Módulo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/cursos/${formData.curso_id}/modulos`)}
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
