import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Mail, Phone, Building, User } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  origem?: string;
  status: string;
  pontuacao: number;
  notas?: string;
  valor_potencial?: number;
}

export const CRMLeads = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    cargo: "",
    origem: "website",
    status: "novo",
    pontuacao: 0,
    notas: "",
    valor_potencial: "",
  });

  const { data: leads, isLoading } = useQuery({
    queryKey: ["marketing-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_leads")
        .select("*")
        .order("criado_em", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("marketing_leads").insert([{
        ...data,
        valor_potencial: data.valor_potencial ? parseFloat(data.valor_potencial) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-leads"] });
      toast.success("Lead criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("marketing_leads")
        .update({
          ...data,
          valor_potencial: data.valor_potencial ? parseFloat(data.valor_potencial) : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-leads"] });
      toast.success("Lead atualizado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-leads"] });
      toast.success("Lead deletado com sucesso!");
    },
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      empresa: "",
      cargo: "",
      origem: "website",
      status: "novo",
      pontuacao: 0,
      notas: "",
      valor_potencial: "",
    });
    setEditingLead(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone || "",
      empresa: lead.empresa || "",
      cargo: lead.cargo || "",
      origem: lead.origem || "website",
      status: lead.status,
      pontuacao: lead.pontuacao,
      notas: lead.notas || "",
      valor_potencial: lead.valor_potencial?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const statusColors: Record<string, string> = {
    novo: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
    contato: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
    qualificado: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
    proposta: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
    negociacao: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
    ganho: "bg-green-500/20 text-green-700 dark:text-green-400",
    perdido: "bg-red-500/20 text-red-700 dark:text-red-400",
  };

  const filteredLeads = filterStatus === "all" 
    ? leads 
    : leads?.filter(lead => lead.status === filterStatus);

  const statusCount = (status: string) => 
    leads?.filter(lead => lead.status === status).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">CRM de Leads</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingLead ? "Editar Lead" : "Novo Lead"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="origem">Origem</Label>
                  <Select
                    value={formData.origem}
                    onValueChange={(value) => setFormData({ ...formData, origem: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="indicacao">Indicação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
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
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="contato">Contato</SelectItem>
                      <SelectItem value="qualificado">Qualificado</SelectItem>
                      <SelectItem value="proposta">Proposta</SelectItem>
                      <SelectItem value="negociacao">Negociação</SelectItem>
                      <SelectItem value="ganho">Ganho</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pontuacao">Pontuação</Label>
                  <Input
                    id="pontuacao"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.pontuacao}
                    onChange={(e) => setFormData({ ...formData, pontuacao: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="valor_potencial">Valor Potencial (R$)</Label>
                  <Input
                    id="valor_potencial"
                    type="number"
                    step="0.01"
                    value={formData.valor_potencial}
                    onChange={(e) => setFormData({ ...formData, valor_potencial: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingLead ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: "Todos", value: "all", count: leads?.length || 0 },
          { label: "Novo", value: "novo", count: statusCount("novo") },
          { label: "Contato", value: "contato", count: statusCount("contato") },
          { label: "Qualificado", value: "qualificado", count: statusCount("qualificado") },
          { label: "Proposta", value: "proposta", count: statusCount("proposta") },
          { label: "Negociação", value: "negociacao", count: statusCount("negociacao") },
          { label: "Ganho", value: "ganho", count: statusCount("ganho") },
        ].map((status) => (
          <Card
            key={status.value}
            className={`cursor-pointer transition-colors ${
              filterStatus === status.value ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setFilterStatus(status.value)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{status.count}</p>
                <p className="text-sm text-muted-foreground">{status.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredLeads && filteredLeads.length > 0 ? (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <Card key={lead.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{lead.nome}</h3>
                          <Badge className={statusColors[lead.status]}>{lead.status}</Badge>
                          {lead.pontuacao > 0 && (
                            <Badge variant="outline">Score: {lead.pontuacao}</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          {lead.telefone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.telefone}
                            </div>
                          )}
                          {lead.empresa && (
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {lead.empresa}
                              {lead.cargo && ` - ${lead.cargo}`}
                            </div>
                          )}
                        </div>
                        {lead.origem && (
                          <Badge variant="outline" className="text-xs">
                            Origem: {lead.origem}
                          </Badge>
                        )}
                        {lead.valor_potencial && (
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            Valor Potencial: R$ {lead.valor_potencial.toFixed(2)}
                          </p>
                        )}
                        {lead.notas && (
                          <p className="text-sm text-muted-foreground italic">{lead.notas}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(lead)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(lead.id)}
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
            <p className="text-muted-foreground">Nenhum lead encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};