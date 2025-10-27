import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Sparkles, RefreshCw } from "lucide-react";

export const CopyGenerator = () => {
  const [context, setContext] = useState("");
  const [type, setType] = useState("post");
  const [tone, setTone] = useState("profissional");
  const [platform, setPlatform] = useState("instagram");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!context.trim()) {
      toast({
        title: "Contexto necessário",
        description: "Por favor, descreva sobre o que deseja criar o conteúdo.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-copy', {
        body: { type, context, tone, platform }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedCopy(data.copy);
      toast({
        title: "Copy gerada com sucesso!",
        description: "Seu texto está pronto para uso.",
      });
    } catch (error) {
      console.error('Erro ao gerar copy:', error);
      toast({
        title: "Erro ao gerar copy",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCopy);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerador de Copy com IA
          </CardTitle>
          <CardDescription>
            Crie textos persuasivos automaticamente para redes sociais, anúncios e emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={type} onValueChange={setType}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="post">Post</TabsTrigger>
              <TabsTrigger value="ad">Anúncio</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="landing">Landing</TabsTrigger>
              <TabsTrigger value="video">Vídeo</TabsTrigger>
            </TabsList>

            <TabsContent value={type} className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom de Voz</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="conversacional">Conversacional</SelectItem>
                      <SelectItem value="persuasivo">Persuasivo</SelectItem>
                      <SelectItem value="educativo">Educativo</SelectItem>
                      <SelectItem value="inspirador">Inspirador</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plataforma</label>
                  <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="google-ads">Google Ads</SelectItem>
                      <SelectItem value="meta-ads">Meta Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Descreva o contexto (curso, produto, promoção, etc.)
                </label>
                <Textarea
                  placeholder="Ex: Curso de Automação Industrial com certificado, turma com desconto de 40% até sexta-feira..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando copy com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Copy
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {generatedCopy && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Copy Gerada</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm">
              {generatedCopy}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banco de Ideias */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Banco de Ideias de Conteúdo</CardTitle>
          <CardDescription>Templates prontos para inspiração</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { titulo: "Lançamento de Curso", desc: "Anuncie novo curso com oferta especial" },
              { titulo: "Depoimento de Aluno", desc: "Destaque resultado de aluno aprovado" },
              { titulo: "Dica Rápida", desc: "Compartilhe dica valiosa do nicho" },
              { titulo: "Bastidores", desc: "Mostre processo de criação do curso" },
              { titulo: "FAQ", desc: "Responda dúvida comum dos alunos" },
              { titulo: "Countdown", desc: "Crie urgência para promoção" },
            ].map((idea, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start h-auto py-3 px-4"
                onClick={() => setContext(`Criar conteúdo sobre: ${idea.titulo} - ${idea.desc}`)}
              >
                <div className="text-left">
                  <p className="font-semibold">{idea.titulo}</p>
                  <p className="text-xs text-muted-foreground">{idea.desc}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gatilhos Mentais */}
      <Card>
        <CardHeader>
          <CardTitle>🧠 Gatilhos Mentais</CardTitle>
          <CardDescription>Use esses gatilhos em suas copies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "Escassez", "Urgência", "Prova Social", "Autoridade",
              "Reciprocidade", "Exclusividade", "Novidade", "Garantia"
            ].map((gatilho) => (
              <div key={gatilho} className="p-3 bg-primary/10 rounded-lg text-center font-medium text-sm">
                {gatilho}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
