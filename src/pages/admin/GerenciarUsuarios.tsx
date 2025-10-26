import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, Plus, Mail, User as UserIcon } from "lucide-react";
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

interface Usuario {
  id: string;
  email: string;
  nome_completo: string;
  cpf: string | null;
  criado_em: string;
}

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
    nome_completo: "",
    cpf: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsuarios(data || []);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from("usuarios")
          .update({
            nome_completo: formData.nome_completo,
            cpf: formData.cpf,
          })
          .eq("id", editingUser.id);

        if (error) throw error;

        toast({ title: "Usuário atualizado com sucesso" });
      } else {
        // Create new user (requires admin privileges and auth.admin API)
        toast({
          title: "Funcionalidade em desenvolvimento",
          description: "Criação manual de usuários estará disponível em breve",
        });
        return;
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({ email: "", senha: "", nome_completo: "", cpf: "" });
      fetchUsuarios();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    const { error } = await supabase.from("usuarios").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Usuário excluído com sucesso" });
      fetchUsuarios();
    }
  };

  const openEditDialog = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      senha: "",
      nome_completo: user.nome_completo,
      cpf: user.cpf || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({ email: "", senha: "", nome_completo: "", cpf: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Administre os usuários da plataforma</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? "Atualize as informações do usuário"
                  : "Adicione um novo usuário à plataforma"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={!!editingUser}
                />
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_completo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {usuarios.map((usuario) => (
          <Card key={usuario.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="mb-1 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    {usuario.nome_completo}
                  </CardTitle>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {usuario.email}
                    </p>
                    {usuario.cpf && <p>CPF: {usuario.cpf}</p>}
                    <p>
                      Cadastrado em:{" "}
                      {new Date(usuario.criado_em).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(usuario)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este usuário? Esta ação
                        não pode ser desfeita e removerá todos os dados
                        associados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteUser(usuario.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
