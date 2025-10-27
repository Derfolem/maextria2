import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

export default function AulaForm() {
  const { moduloId, aulaId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    ordem: 1,
    video_url: "",
    conteudo_html: "",
  });

  const isEditMode = !!aulaId;

  useEffect(() => {
    if (aulaId) {
      fetchAula();
    } else if (moduloId) {
      fetchNextOrdem();
    }
  }, [aulaId, moduloId]);

  const fetchAula = async () => {
    const { data, error } = await supabase
      .from("aulas")
      .select("*")
      .eq("id", aulaId)
      .single();

    if (error) {
      toast({
        title: "Erro ao carregar aula",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setFormData({
        titulo: data.titulo,
        ordem: data.ordem,
        video_url: data.video_url || "",
        conteudo_html: data.conteudo_html || "",
      });
    }
  };

  const fetchNextOrdem = async () => {
    const { count } = await supabase
      .from("aulas")
      .select("*", { count: "exact", head: true })
      .eq("modulo_id", moduloId);

    setFormData({ ...formData, ordem: (count || 0) + 1 });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('course-images')
        .getPublicUrl(filePath);

      // Inserir imagem no conteúdo HTML
      const imageHtml = `<img src="${data.publicUrl}" alt="Imagem da aula" style="max-width: 100%; height: auto;" />`;
      setFormData({
        ...formData,
        conteudo_html: formData.conteudo_html + imageHtml,
      });

      toast({
        title: "Imagem enviada com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditMode) {
        const { error } = await supabase
          .from("aulas")
          .update({
            titulo: formData.titulo,
            ordem: formData.ordem,
            video_url: formData.video_url || null,
            conteudo_html: formData.conteudo_html || null,
          })
          .eq("id", aulaId);

        if (error) throw error;
        toast({ title: "Aula atualizada com sucesso" });
      } else {
        const { error } = await supabase.from("aulas").insert([{
          modulo_id: moduloId,
          titulo: formData.titulo,
          ordem: formData.ordem,
          video_url: formData.video_url || null,
          conteudo_html: formData.conteudo_html || null,
        }]);

        if (error) throw error;
        toast({ title: "Aula criada com sucesso" });
      }

      navigate(`/admin/modulos/${moduloId}/aulas`);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar aula",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode ? "Editar Aula" : "Nova Aula"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título da Aula *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="1"
                  value={formData.ordem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ordem: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">URL do Vídeo (YouTube/Vimeo)</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) =>
                    setFormData({ ...formData, video_url: e.target.value })
                  }
                  placeholder="https://www.youtube.com/embed/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conteudo">Conteúdo HTML</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo_html}
                  onChange={(e) =>
                    setFormData({ ...formData, conteudo_html: e.target.value })
                  }
                  rows={10}
                  placeholder="Digite o conteúdo HTML da aula aqui..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Adicionar Imagem
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Atualizar" : "Criar"} Aula
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/modulos/${moduloId}/aulas`)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
