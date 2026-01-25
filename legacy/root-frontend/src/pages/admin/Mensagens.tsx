import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Search, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Mensagem {
  id: string;
  remetente_nome: string;
  remetente_email: string;
  assunto: string;
  mensagem: string;
  status: string;
  resposta: string | null;
  criado_em: string;
  respondida_em: string | null;
}

export default function Mensagens() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [filteredMensagens, setFilteredMensagens] = useState<Mensagem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMensagem, setSelectedMensagem] = useState<Mensagem | null>(null);
  const [resposta, setResposta] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMensagens();
  }, []);

  useEffect(() => {
    const filtered = mensagens.filter(
      (m) =>
        m.remetente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.remetente_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.assunto.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMensagens(filtered);
  }, [searchTerm, mensagens]);

  const fetchMensagens = async () => {
    const { data, error } = await supabase
      .from("mensagens")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMensagens(data || []);
      setFilteredMensagens(data || []);
    }
  };

  const handleOpenMensagem = async (mensagem: Mensagem) => {
    setSelectedMensagem(mensagem);
    setResposta(mensagem.resposta || "");

    // Marcar como lida
    if (mensagem.status === "nao_lida") {
      await supabase
        .from("mensagens")
        .update({ status: "lida" })
        .eq("id", mensagem.id);
      
      fetchMensagens();
    }
  };

  const handleResponder = async () => {
    if (!selectedMensagem || !resposta.trim()) {
      toast({
        title: "Resposta vazia",
        description: "Por favor, escreva uma resposta",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from("mensagens")
        .update({
          resposta: resposta,
          status: "respondida",
          respondida_em: new Date().toISOString(),
        })
        .eq("id", selectedMensagem.id);

      if (error) throw error;

      toast({
        title: "Resposta enviada",
        description: "A mensagem foi respondida com sucesso",
      });

      setSelectedMensagem(null);
      setResposta("");
      fetchMensagens();
    } catch (error: any) {
      toast({
        title: "Erro ao enviar resposta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "nao_lida":
        return <Badge variant="destructive">Não lida</Badge>;
      case "lida":
        return <Badge variant="secondary">Lida</Badge>;
      case "respondida":
        return <Badge>Respondida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mensagens</h1>
        <p className="text-muted-foreground">
          Gerencie as mensagens recebidas dos usuários
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredMensagens.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              {searchTerm
                ? "Nenhuma mensagem encontrada com esse termo"
                : "Nenhuma mensagem recebida ainda"}
            </CardContent>
          </Card>
        ) : (
          filteredMensagens.map((mensagem) => (
            <Card
              key={mensagem.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleOpenMensagem(mensagem)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4" />
                      {mensagem.assunto}
                    </CardTitle>
                    <CardDescription>
                      De: {mensagem.remetente_nome} ({mensagem.remetente_email})
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(mensagem.status)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(mensagem.criado_em).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {mensagem.mensagem}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={!!selectedMensagem}
        onOpenChange={() => setSelectedMensagem(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMensagem?.assunto}</DialogTitle>
            <DialogDescription>
              De: {selectedMensagem?.remetente_nome} (
              {selectedMensagem?.remetente_email})
              <br />
              Recebida em:{" "}
              {selectedMensagem &&
                new Date(selectedMensagem.criado_em).toLocaleString("pt-BR")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Mensagem:</h4>
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{selectedMensagem?.mensagem}</p>
              </div>
            </div>

            {selectedMensagem?.resposta && (
              <div>
                <h4 className="font-semibold mb-2">Resposta enviada:</h4>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMensagem.resposta}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Respondida em:{" "}
                    {selectedMensagem.respondida_em &&
                      new Date(selectedMensagem.respondida_em).toLocaleString(
                        "pt-BR"
                      )}
                  </p>
                </div>
              </div>
            )}

            {selectedMensagem?.status !== "respondida" && (
              <div>
                <h4 className="font-semibold mb-2">Sua resposta:</h4>
                <Textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={6}
                  placeholder="Escreva sua resposta aqui..."
                />
              </div>
            )}
          </div>

          {selectedMensagem?.status !== "respondida" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMensagem(null)}>
                Cancelar
              </Button>
              <Button onClick={handleResponder} disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Enviando..." : "Enviar Resposta"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}