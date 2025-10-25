import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cursoSchema } from "@/lib/schemas";
import { Loader2 } from "lucide-react";

export default function CursoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    slug: "",
    descricao: "",
    publico_alvo: "",
    carga_horaria_horas: 0,
    imagem_capa_url: "",
    preco_certificado: 39.00,
    ativo: true,
  });

  const isEditMode = !!id;

  useEffect(() => {
    if (id) {
      fetchCurso();
    }
  }, [id]);

  const fetchCurso = async () => {
    const { data, error } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Erro ao carregar curso",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        titulo: data.titulo,
        slug: data.slug,
        descricao: data.descricao || "",
        publico_alvo: data.publico_alvo || "",
        carga_horaria_horas: data.carga_horaria_horas || 0,
        imagem_capa_url: data.imagem_capa_url || "",
        preco_certificado: data.preco_certificado || 39.00,
        ativo: data.ativo,
      });
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTituloChange = (value: string) => {
    setFormData({
      ...formData,
      titulo: value,
      slug: generateSlug(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = cursoSchema.parse(formData);

      if (isEditMode) {
        const { error } = await supabase
          .from("cursos")
          .update({
            titulo: validatedData.titulo,
            slug: validatedData.slug,
            descricao: validatedData.descricao,
            publico_alvo: validatedData.publico_alvo,
            carga_horaria_horas: validatedData.carga_horaria_horas,
            imagem_capa_url: validatedData.imagem_capa_url,
            preco_certificado: validatedData.preco_certificado,
            ativo: validatedData.ativo,
          })
          .eq("id", id);

        if (error) throw error;
        toast({ title: "Curso atualizado com sucesso" });
      } else {
        const { error } = await supabase.from("cursos").insert([{
          titulo: validatedData.titulo,
          slug: validatedData.slug,
          descricao: validatedData.descricao,
          publico_alvo: validatedData.publico_alvo,
          carga_horaria_horas: validatedData.carga_horaria_horas,
          imagem_capa_url: validatedData.imagem_capa_url,
          preco_certificado: validatedData.preco_certificado,
          ativo: validatedData.ativo,
        }]);

        if (error) throw error;
        toast({ title: "Curso criado com sucesso" });
      }

      navigate("/admin/cursos");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar curso",
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
            {isEditMode ? "Editar Curso" : "Novo Curso"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleTituloChange(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico_alvo">Público-alvo</Label>
              <Textarea
                id="publico_alvo"
                value={formData.publico_alvo}
                onChange={(e) =>
                  setFormData({ ...formData, publico_alvo: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carga_horaria">Carga Horária (horas)</Label>
              <Input
                id="carga_horaria"
                type="number"
                min="1"
                value={formData.carga_horaria_horas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    carga_horaria_horas: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagem_capa_url">URL da Imagem de Capa</Label>
              <Input
                id="imagem_capa_url"
                type="url"
                value={formData.imagem_capa_url}
                onChange={(e) =>
                  setFormData({ ...formData, imagem_capa_url: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_certificado">Preço do Certificado (R$)</Label>
              <Input
                id="preco_certificado"
                type="number"
                min="0"
                step="0.01"
                value={formData.preco_certificado}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    preco_certificado: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Este valor será cobrado na emissão do certificado
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
              <Label htmlFor="ativo">Curso ativo</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? "Atualizar" : "Criar"} Curso
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/cursos")}
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
