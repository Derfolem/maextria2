import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Award, BookOpen, Edit, Key, Lock, Mail, Trash2, Unlock, User } from "lucide-react";

interface Usuario {
  id: string;
  email: string;
  nome_completo: string;
  cpf: string | null;
  bloqueado: boolean;
  criado_em: string;
}

interface Matricula {
  id: string;
  cursos: {
    titulo: string;
  };
  data_matricula: string;
}

interface Certificado {
  id: string;
  cursos: {
    titulo: string;
  };
  emitido_em: string;
  pago: boolean;
}

export default function DetalhesUsuario() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome_completo: "",
    cpf: "",
  });
  const [novaSenha, setNovaSenha] = useState("");
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUsuarioDetalhes();
    }
  }, [userId]);

  const fetchUsuarioDetalhes = async () => {
    // Fetch usuario
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      toast({
        title: "Erro ao carregar usuário",
        description: userError?.message,
        variant: "destructive",
      });
      navigate("/admin/usuarios");
      return;
    }

    setUsuario(userData);
    setEditForm({
      nome_completo: userData.nome_completo,
      cpf: userData.cpf || "",
    });

    // Fetch matriculas
    const { data: matriculasData } = await supabase
      .from("matriculas")
      .select("id, data_matricula, cursos(titulo)")
      .eq("usuario_id", userId)
      .eq("ativa", true);

    setMatriculas(matriculasData || []);

    // Fetch certificados
    const { data: certificadosData } = await supabase
      .from("certificados")
      .select("id, emitido_em, pago, cursos(titulo)")
      .eq("usuario_id", userId);

    setCertificados(certificadosData || []);
  };

  const handleToggleBloqueio = async () => {
    if (!usuario) return;

    const { error } = await supabase
      .from("usuarios")
      .update({ bloqueado: !usuario.bloqueado })
      .eq("id", usuario.id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: usuario.bloqueado ? "Usuário desbloqueado" : "Usuário bloqueado",
        description: `O usuário foi ${usuario.bloqueado ? "desbloqueado" : "bloqueado"} com sucesso`,
      });
      fetchUsuarioDetalhes();
    }
  };

  const handleSaveEdit = async () => {
    if (!usuario) return;

    const { error } = await supabase
      .from("usuarios")
      .update({
        nome_completo: editForm.nome_completo,
        cpf: editForm.cpf || null,
      })
      .eq("id", usuario.id);

    if (error) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário atualizado",
        description: "Os dados foram salvos com sucesso",
      });
      setIsEditDialogOpen(false);
      fetchUsuarioDetalhes();
    }
  };

  const handleRedefinirSenha = async () => {
    if (!usuario) return;

    // Gerar senha temporária
    const senhaTemp = Math.random().toString(36).slice(-8);
    setNovaSenha(senhaTemp);
    setShowNovaSenha(true);

    toast({
      title: "Senha temporária gerada",
      description: "Copie a senha e repasse ao usuário",
    });
  };

  const handleExcluirUsuario = async () => {
    if (!usuario) return;

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", usuario.id);

    if (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário excluído",
        description: "O usuário e todos os dados associados foram removidos",
      });
      navigate("/admin/usuarios");
    }
  };

  if (!usuario) {
    return <div className="container mx-auto px-4 py-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/usuarios")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="grid gap-6">
        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {usuario.nome_completo}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {usuario.email}
                </CardDescription>
              </div>
              {usuario.bloqueado ? (
                <Badge variant="destructive">Bloqueado</Badge>
              ) : (
                <Badge>Ativo</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">CPF:</span>
                <p className="font-medium">{usuario.cpf || "Não informado"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cadastrado em:</span>
                <p className="font-medium">
                  {new Date(usuario.criado_em).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Dados
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Usuário</DialogTitle>
                    <DialogDescription>
                      Atualize as informações do usuário
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={editForm.nome_completo}
                        onChange={(e) =>
                          setEditForm({ ...editForm, nome_completo: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input
                        value={editForm.cpf}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cpf: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleBloqueio}
              >
                {usuario.bloqueado ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Desbloquear
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Bloquear
                  </>
                )}
              </Button>

              <Dialog open={showNovaSenha} onOpenChange={setShowNovaSenha}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleRedefinirSenha}>
                    <Key className="h-4 w-4 mr-2" />
                    Redefinir Senha
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Senha Temporária Gerada</DialogTitle>
                    <DialogDescription>
                      Copie esta senha e repasse ao usuário
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-mono text-lg font-bold text-center">
                      {novaSenha}
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      navigator.clipboard.writeText(novaSenha);
                      toast({
                        title: "Senha copiada",
                        description: "A senha foi copiada para a área de transferência",
                      });
                    }}>
                      Copiar Senha
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados associados
                      (matrículas, progresso, certificados) serão excluídos
                      permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExcluirUsuario}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Cursos Matriculados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Cursos Matriculados ({matriculas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matriculas.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum curso matriculado
              </p>
            ) : (
              <div className="space-y-2">
                {matriculas.map((matricula) => (
                  <div
                    key={matricula.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span>{(matricula.cursos as any)?.titulo}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(matricula.data_matricula).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Certificados ({certificados.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {certificados.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum certificado emitido
              </p>
            ) : (
              <div className="space-y-2">
                {certificados.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p>{(cert.cursos as any)?.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(cert.emitido_em).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {cert.pago ? (
                      <Badge>Pago</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}