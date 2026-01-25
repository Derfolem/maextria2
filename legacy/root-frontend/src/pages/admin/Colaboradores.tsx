import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";
import { AdminNavbar } from "@/components/admin/AdminNavbar";

interface Colaborador {
  id: string;
  email: string;
  nome: string;
  ativo: boolean;
  usuario_id: string;
  permissoes: string[];
}

const permissoesDisponiveis = [
  { value: 'gerenciar_cursos', label: 'Gerenciar Cursos' },
  { value: 'gerenciar_modulos', label: 'Gerenciar Módulos' },
  { value: 'gerenciar_aulas', label: 'Gerenciar Aulas' },
  { value: 'gerenciar_questoes', label: 'Gerenciar Questões' },
  { value: 'visualizar_usuarios', label: 'Visualizar Usuários' },
  { value: 'gerenciar_conteudo', label: 'Gerenciar Conteúdo' },
  { value: 'visualizar_financeiro', label: 'Visualizar Financeiro' },
  { value: 'gerenciar_marketing', label: 'Gerenciar Marketing' },
];

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const fetchColaboradores = async () => {
    const { data: colaboradoresData, error } = await supabase
      .from("colaboradores")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar colaboradores",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Buscar permissões de cada colaborador
    const colaboradoresComPermissoes = await Promise.all(
      colaboradoresData.map(async (col) => {
        const { data: perms } = await supabase
          .from("colaborador_permissoes")
          .select("permissao")
          .eq("colaborador_id", col.id);

        return {
          ...col,
          permissoes: perms?.map((p) => p.permissao) || [],
        };
      })
    );

    setColaboradores(colaboradoresComPermissoes);
  };

  const handleConvidarColaborador = async () => {
    if (!novoEmail) {
      toast({
        title: "Preencha o email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar usuário pelo email
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("id, nome_completo")
        .eq("email", novoEmail)
        .maybeSingle();

      if (userError || !userData) {
        toast({
          title: "Usuário não encontrado",
          description: "Este email não está cadastrado no sistema. O usuário precisa criar uma conta primeiro.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Obter usuário admin atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já é colaborador
      const { data: existingColab } = await supabase
        .from("colaboradores")
        .select("id")
        .eq("usuario_id", userData.id)
        .maybeSingle();

      if (existingColab) {
        toast({
          title: "Este usuário já é colaborador",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Criar colaborador
      const { data: colaborador, error: colabError } = await supabase
        .from("colaboradores")
        .insert({
          admin_id: user.id,
          usuario_id: userData.id,
          email: novoEmail,
          nome: novoNome || userData.nome_completo,
        })
        .select()
        .single();

      if (colabError) throw colabError;

      // Adicionar permissões
      if (permissoesSelecionadas.length > 0) {
        const permissoes = permissoesSelecionadas.map((perm) => ({
          colaborador_id: colaborador.id,
          permissao: perm as any,
        }));

        const { error: permError } = await supabase
          .from("colaborador_permissoes")
          .insert(permissoes);

        if (permError) throw permError;
      }

      toast({
        title: "Colaborador adicionado com sucesso",
      });

      setNovoEmail("");
      setNovoNome("");
      setPermissoesSelecionadas([]);
      fetchColaboradores();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar colaborador",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverColaborador = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este colaborador?")) return;

    const { error } = await supabase
      .from("colaboradores")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao remover colaborador",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Colaborador removido com sucesso",
    });
    fetchColaboradores();
  };

  const handleToggleAtivo = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from("colaboradores")
      .update({ ativo: !ativo })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: ativo ? "Colaborador desativado" : "Colaborador ativado",
    });
    fetchColaboradores();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Gerenciar Colaboradores</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Adicionar Colaborador
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                O usuário deve ter uma conta criada antes de ser adicionado como colaborador
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Usuário</Label>
                <Input
                  id="email"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
                <p className="text-xs text-muted-foreground">
                  Digite o email de um usuário já cadastrado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome (opcional)</Label>
                <Input
                  id="nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Deixe em branco para usar o nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="space-y-2">
                  {permissoesDisponiveis.map((perm) => (
                    <div key={perm.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={perm.value}
                        checked={permissoesSelecionadas.includes(perm.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPermissoesSelecionadas([...permissoesSelecionadas, perm.value]);
                          } else {
                            setPermissoesSelecionadas(
                              permissoesSelecionadas.filter((p) => p !== perm.value)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={perm.value} className="cursor-pointer">
                        {perm.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleConvidarColaborador}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Adicionando..." : "Adicionar Colaborador"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colaboradores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {colaboradores.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum colaborador cadastrado
                </p>
              ) : (
                <div className="space-y-4">
                  {colaboradores.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      className={`flex items-start justify-between p-4 border rounded-lg ${
                        !colaborador.ativo ? "opacity-50" : ""
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{colaborador.nome}</p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              colaborador.ativo
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {colaborador.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{colaborador.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {colaborador.permissoes.map((perm) => (
                            <span
                              key={perm}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              {permissoesDisponiveis.find((p) => p.value === perm)?.label}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAtivo(colaborador.id, colaborador.ativo)}
                          title={colaborador.ativo ? "Desativar" : "Ativar"}
                        >
                          {colaborador.ativo ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverColaborador(colaborador.id)}
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
