import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Image as ImageIcon } from "lucide-react";

export default function CertificadoModelo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState({
    logo_url: "",
    assinatura_url: "",
    titulo_fonte: "Arial",
    titulo_tamanho: "24",
    texto_fonte: "Arial", 
    texto_tamanho: "14",
    cor_titulo: "#000000",
    cor_texto: "#333333",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("configuracoes_site")
        .select("chave, valor")
        .in("chave", [
          "certificado_logo_url",
          "certificado_assinatura_url",
          "certificado_titulo_fonte",
          "certificado_titulo_tamanho",
          "certificado_texto_fonte",
          "certificado_texto_tamanho",
          "certificado_cor_titulo",
          "certificado_cor_texto",
        ]);

      if (data) {
        const configObj: any = {};
        data.forEach((item) => {
          const key = item.chave.replace("certificado_", "");
          configObj[key] = item.valor || "";
        });
        setConfig((prev) => ({ ...prev, ...configObj }));
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "assinatura") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${type}-${Math.random()}.${fileExt}`;
      const filePath = `certificados/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("course-images")
        .getPublicUrl(filePath);

      setConfig((prev) => ({
        ...prev,
        [`${type}_url`]: publicUrl,
      }));

      toast({
        title: "Upload concluído",
        description: "Imagem enviada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = [
        { chave: "certificado_logo_url", valor: config.logo_url, descricao: "URL da logo do certificado" },
        { chave: "certificado_assinatura_url", valor: config.assinatura_url, descricao: "URL da assinatura do certificado" },
        { chave: "certificado_titulo_fonte", valor: config.titulo_fonte, descricao: "Fonte do título" },
        { chave: "certificado_titulo_tamanho", valor: config.titulo_tamanho, descricao: "Tamanho do título" },
        { chave: "certificado_texto_fonte", valor: config.texto_fonte, descricao: "Fonte do texto" },
        { chave: "certificado_texto_tamanho", valor: config.texto_tamanho, descricao: "Tamanho do texto" },
        { chave: "certificado_cor_titulo", valor: config.cor_titulo, descricao: "Cor do título" },
        { chave: "certificado_cor_texto", valor: config.cor_texto, descricao: "Cor do texto" },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("configuracoes_site")
          .upsert(update, { onConflict: "chave" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "O modelo de certificado foi atualizado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Modelo de Certificado</h1>
        <p className="text-muted-foreground">Configure o design dos certificados emitidos pela plataforma</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>Logo e assinatura que aparecerão no certificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo">Logo da Instituição</Label>
              <div className="flex items-center gap-4">
                {config.logo_url && (
                  <img src={config.logo_url} alt="Logo" className="h-20 w-auto object-contain" />
                )}
                <div className="flex-1">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "logo")}
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assinatura">Assinatura</Label>
              <div className="flex items-center gap-4">
                {config.assinatura_url && (
                  <img src={config.assinatura_url} alt="Assinatura" className="h-20 w-auto object-contain" />
                )}
                <div className="flex-1">
                  <Input
                    id="assinatura"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "assinatura")}
                    disabled={uploading}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipografia</CardTitle>
            <CardDescription>Fontes e tamanhos do texto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titulo_fonte">Fonte do Título</Label>
                <Input
                  id="titulo_fonte"
                  value={config.titulo_fonte}
                  onChange={(e) => setConfig({ ...config, titulo_fonte: e.target.value })}
                  placeholder="Arial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titulo_tamanho">Tamanho do Título</Label>
                <Input
                  id="titulo_tamanho"
                  type="number"
                  value={config.titulo_tamanho}
                  onChange={(e) => setConfig({ ...config, titulo_tamanho: e.target.value })}
                  placeholder="24"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="texto_fonte">Fonte do Texto</Label>
                <Input
                  id="texto_fonte"
                  value={config.texto_fonte}
                  onChange={(e) => setConfig({ ...config, texto_fonte: e.target.value })}
                  placeholder="Arial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="texto_tamanho">Tamanho do Texto</Label>
                <Input
                  id="texto_tamanho"
                  type="number"
                  value={config.texto_tamanho}
                  onChange={(e) => setConfig({ ...config, texto_tamanho: e.target.value })}
                  placeholder="14"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cores</CardTitle>
            <CardDescription>Esquema de cores do certificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cor_titulo">Cor do Título</Label>
                <div className="flex gap-2">
                  <Input
                    id="cor_titulo"
                    type="color"
                    value={config.cor_titulo}
                    onChange={(e) => setConfig({ ...config, cor_titulo: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={config.cor_titulo}
                    onChange={(e) => setConfig({ ...config, cor_titulo: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cor_texto">Cor do Texto</Label>
                <div className="flex gap-2">
                  <Input
                    id="cor_texto"
                    type="color"
                    value={config.cor_texto}
                    onChange={(e) => setConfig({ ...config, cor_texto: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={config.cor_texto}
                    onChange={(e) => setConfig({ ...config, cor_texto: e.target.value })}
                    placeholder="#333333"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={loading || uploading} size="lg">
          <Save className="h-5 w-5 mr-2" />
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
