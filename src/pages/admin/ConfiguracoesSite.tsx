import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminNavbar } from "@/components/admin/AdminNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Configuracao {
  chave: string;
  valor: string;
  descricao: string;
}

export default function ConfiguracoesSite() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<Configuracao[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
    fetchConfigs();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roles) {
      navigate("/");
    }
  };

  const fetchConfigs = async () => {
    const { data, error } = await supabase
      .from("configuracoes_site")
      .select("*")
      .order("chave");

    if (error) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setConfigs(data);
      const formValues: Record<string, string> = {};
      data.forEach((config) => {
        formValues[config.chave] = config.valor || "";
      });
      setFormData(formValues);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      for (const config of configs) {
        const { error } = await supabase
          .from("configuracoes_site")
          .update({ valor: formData[config.chave] || "" })
          .eq("chave", config.chave);

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFieldLabel = (chave: string) => {
    const labels: Record<string, string> = {
      instagram_url: "Instagram",
      facebook_url: "Facebook",
      linkedin_url: "LinkedIn",
      youtube_url: "YouTube",
      twitter_url: "Twitter/X",
      whatsapp_numero: "WhatsApp",
    };
    return labels[chave] || chave;
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Configurações do Site</h1>
          <p className="text-muted-foreground">
            Gerencie as redes sociais e outras configurações
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>
              Configure os links das redes sociais da Evolui Cursos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {configs.map((config) => (
                <div key={config.chave} className="space-y-2">
                  <Label htmlFor={config.chave}>{getFieldLabel(config.chave)}</Label>
                  <Input
                    id={config.chave}
                    type={config.chave === "whatsapp_numero" ? "tel" : "url"}
                    value={formData[config.chave] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, [config.chave]: e.target.value })
                    }
                    placeholder={config.descricao}
                  />
                  <p className="text-xs text-muted-foreground">{config.descricao}</p>
                </div>
              ))}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Configurações
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/dashboard")}
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
