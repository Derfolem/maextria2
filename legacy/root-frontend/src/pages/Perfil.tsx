import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Lock, User } from "lucide-react";

interface UserProfile {
  id: string;
  nome_completo: string;
  email: string;
  cpf: string | null;
}

interface CreditCardData {
  id: string;
  ultimos_digitos: string;
  bandeira: string;
  nome_titular: string;
  padrao: boolean;
}

const Perfil = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile form
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Credit card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchCards(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setNomeCompleto(data.nome_completo);
      setCpf(data.cpf || "");
    }
  };

  const fetchCards = async (userId: string) => {
    const { data } = await supabase
      .from("cartoes_credito")
      .select("*")
      .eq("usuario_id", userId)
      .order("criado_em", { ascending: false });

    if (data) {
      setCards(data);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("usuarios")
      .update({
        nome_completo: nomeCompleto,
        cpf: cpf || null,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
      fetchProfile(user.id);
    }

    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A nova senha e a confirmação devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      toast({
        title: "Cartão inválido",
        description: "O número do cartão deve ter 16 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Get last 4 digits
    const cleanNumber = cardNumber.replace(/\s/g, "");
    const lastDigits = cleanNumber.slice(-4);
    
    // Detect card brand (simplified)
    let brand = "outros";
    if (cleanNumber.startsWith("4")) brand = "visa";
    else if (cleanNumber.startsWith("5")) brand = "mastercard";
    else if (cleanNumber.startsWith("3")) brand = "amex";

    // In production, you would tokenize this with a payment gateway
    // NEVER store full card numbers
    const { error } = await supabase.from("cartoes_credito").insert({
      usuario_id: user.id,
      ultimos_digitos: lastDigits,
      bandeira: brand,
      nome_titular: cardName,
      padrao: cards.length === 0, // First card is default
    });

    if (error) {
      toast({
        title: "Erro ao cadastrar cartão",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cartão cadastrado",
        description: "Seu cartão foi cadastrado com sucesso.",
      });
      setCardNumber("");
      setCardName("");
      setExpiryDate("");
      setCvv("");
      fetchCards(user.id);
    }

    setLoading(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from("cartoes_credito")
      .delete()
      .eq("id", cardId);

    if (error) {
      toast({
        title: "Erro ao remover cartão",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Cartão removido",
        description: "O cartão foi removido com sucesso.",
      });
      fetchCards(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <h1 className="text-4xl font-bold mb-8">Meu Perfil</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="h-4 w-4 mr-2" />
              Senha
            </TabsTrigger>
            <TabsTrigger value="cards">
              <CreditCard className="h-4 w-4 mr-2" />
              Cartões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O e-mail não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    {loading ? "Alterando..." : "Alterar senha"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cards" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Cartão</CardTitle>
                  <CardDescription>
                    Cadastre um cartão de crédito para pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCard} className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão</Label>
                      <Input
                        id="cardNumber"
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="cardName">Nome no Cartão</Label>
                      <Input
                        id="cardName"
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="NOME COMPLETO"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Validade</Label>
                        <Input
                          id="expiryDate"
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="MM/AA"
                          maxLength={5}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                      {loading ? "Cadastrando..." : "Cadastrar cartão"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meus Cartões</CardTitle>
                  <CardDescription>
                    {cards.length === 0
                      ? "Nenhum cartão cadastrado"
                      : `${cards.length} cartão(ões) cadastrado(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium capitalize">
                              {card.bandeira} •••• {card.ultimos_digitos}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {card.nome_titular}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCard(card.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Perfil;
