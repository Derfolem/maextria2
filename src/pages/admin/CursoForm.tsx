import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cursoSchema } from "@/lib/schemas";
import { Loader2, Sparkles } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";

export default function CursoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    slug: "",
    categoria: "",
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
        categoria: data.categoria || "",
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

  const handleGenerateImage = async () => {
    if (!formData.titulo) {
      toast({
        title: "Preencha o título do curso",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);

    try {
      const prompt = `${formData.titulo} - ${formData.categoria || 'curso online'} - ${formData.descricao || 'curso educacional'}`;

      const { data, error } = await supabase.functions.invoke('generate-course-image', {
        body: { prompt }
      });

      if (error) throw error;

      if (data.imageUrl) {
        setFormData({ ...formData, imagem_capa_url: data.imageUrl });
        toast({
          title: "Imagem gerada com sucesso!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
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
            categoria: validatedData.categoria,
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
          categoria: validatedData.categoria,
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
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) =>
                  setFormData({ ...formData, categoria: e.target.value })
                }
                placeholder="Ex: Marketing Digital, Vendas, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <RichTextEditor
                value={formData.descricao}
                onChange={(value) =>
                  setFormData({ ...formData, descricao: value })
                }
                placeholder="Descreva o curso de forma detalhada..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="publico_alvo">Público-alvo</Label>
              <RichTextEditor
                value={formData.publico_alvo}
                onChange={(value) =>
                  setFormData({ ...formData, publico_alvo: value })
                }
                placeholder="Quem é o público-alvo deste curso?"
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
              <Label htmlFor="imagem_capa_url">Imagem de Capa</Label>
              <div className="flex gap-2">
                <Input
                  id="imagem_capa_url"
                  type="url"
                  value={formData.imagem_capa_url}
                  onChange={(e) =>
                    setFormData({ ...formData, imagem_capa_url: e.target.value })
                  }
                  placeholder="URL da imagem ou gere com IA"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.imagem_capa_url && (
                <img
                  src={formData.imagem_capa_url}
                  alt="Preview"
                  className="mt-2 rounded-lg max-h-48 object-cover"
                />
              )}
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
