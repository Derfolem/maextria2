import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Post {
  id: string;
  titulo: string;
  conteudo: string;
  plataforma: string;
  tipo: string;
  status: string;
  data_agendamento: string;
  hashtags: string[];
}

export const CalendarioEditorial = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    plataforma: "instagram",
    tipo: "post",
    status: "rascunho",
    data_agendamento: "",
    hashtags: "",
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["marketing-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_posts")
        .select("*")
        .order("data_agendamento", { ascending: true });
      
      if (error) throw error;
      return data as Post[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("marketing_posts").insert([{
        ...data,
        hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()) : [],
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-posts"] });
      toast.success("Post criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_posts")
        .update({
          ...data,
          hashtags: data.hashtags ? data.hashtags.split(",").map((t: string) => t.trim()) : [],
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-posts"] });
      toast.success("Post atualizado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-posts"] });
      toast.success("Post deletado com sucesso!");
    },
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      conteudo: "",
      plataforma: "instagram",
      tipo: "post",
      status: "rascunho",
      data_agendamento: "",
      hashtags: "",
    });
    setEditingPost(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setFormData({
      titulo: post.titulo,
      conteudo: post.conteudo || "",
      plataforma: post.plataforma,
      tipo: post.tipo,
      status: post.status,
      data_agendamento: post.data_agendamento || "",
      hashtags: post.hashtags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    agendado: "bg-primary/20 text-primary",
    publicado: "bg-green-500/20 text-green-700 dark:text-green-400",
    cancelado: "bg-destructive/20 text-destructive",
  };

  const filteredPosts = selectedDate
    ? posts?.filter((post) => {
        if (!post.data_agendamento) return false;
        const postDate = new Date(post.data_agendamento);
        return format(postDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
      })
    : posts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Calendário Editorial</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Editar Post" : "Novo Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plataforma">Plataforma</Label>
                  <Select
                    value={formData.plataforma}
                    onValueChange={(value) => setFormData({ ...formData, plataforma: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="blog">Blog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="artigo">Artigo</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="agendado">Agendado</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data_agendamento">Data de Agendamento</Label>
                  <Input
                    id="data_agendamento"
                    type="datetime-local"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="hashtags">Hashtags (separadas por vírgula)</Label>
                <Input
                  id="hashtags"
                  value={formData.hashtags}
                  onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                  placeholder="#marketing, #cursos, #educacao"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPost ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Posts para ${format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}`
                : "Todos os Posts"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Carregando...</p>
            ) : filteredPosts && filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{post.titulo}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{post.conteudo}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline">{post.plataforma}</Badge>
                            <Badge variant="outline">{post.tipo}</Badge>
                            <Badge className={statusColors[post.status]}>{post.status}</Badge>
                            {post.data_agendamento && (
                              <Badge variant="outline">
                                {format(new Date(post.data_agendamento), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </Badge>
                            )}
                          </div>
                          {post.hashtags && post.hashtags.length > 0 && (
                            <p className="text-sm text-primary mt-2">
                              {post.hashtags.join(" ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(post)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum post encontrado para esta data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};