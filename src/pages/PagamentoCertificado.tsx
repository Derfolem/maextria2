import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Award, CheckCircle2, CreditCard, Download } from "lucide-react";

const PagamentoCertificado = () => {
  const navigate = useNavigate();
  const { cursoId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [curso, setCurso] = useState<any>(null);
  const [certificado, setCertificado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchData(session.user.id);
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
  }, [navigate, cursoId]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const mpStatus = searchParams.get("mp");
    const mpPaymentId =
      searchParams.get("payment_id") ||
      searchParams.get("collection_id") ||
      searchParams.get("paymentId");

    if (paymentStatus === "success" && user) {
      handlePaymentSuccess();
      return;
    }

    if (paymentStatus === "canceled") {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      return;
    }

    if (mpStatus === "success" && mpPaymentId && user) {
      handleMercadoPagoSuccess(mpPaymentId);
      return;
    }

    if (mpStatus === "pending") {
      toast({
        title: "Pagamento pendente",
        description: "Seu pagamento está em análise. Verifique novamente em instantes.",
      });
      return;
    }

    if (mpStatus === "failure") {
      toast({
        title: "Pagamento não aprovado",
        description: "O pagamento não foi concluído. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [searchParams, user]);

  const handlePaymentSuccess = async () => {
    if (!user || !cursoId) return;

    try {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        toast({
          title: "Pagamento em processamento",
          description: "Aguardando confirmação. Atualize a página em alguns instantes.",
        });
        return;
      }

      setProcessing(true);

      const { error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId },
      });

      if (error) throw error;

      toast({
        title: "Pagamento confirmado!",
        description: "Seu certificado foi emitido com sucesso.",
      });

      fetchData(user.id);
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const fetchData = async (userId: string) => {
    setLoading(true);

    // Fetch course
    const { data: cursoData } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", cursoId)
      .single();

    if (cursoData) {
      setCurso(cursoData);
    }

    // Check exam result
    const { data: resultData } = await supabase
      .from("prova_resultado")
      .select("*")
      .eq("usuario_id", userId)
      .eq("curso_id", cursoId)
      .eq("aprovado", true)
      .maybeSingle();

    if (!resultData) {
      toast({
        title: "Acesso negado",
        description: "Você precisa ser aprovado na prova para emitir o certificado.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    // Check certificate
    const { data: certData } = await supabase
      .from("certificados")
      .select("*")
      .eq("usuario_id", userId)
      .eq("curso_id", cursoId)
      .maybeSingle();

    if (certData) {
      setCertificado(certData);
    }

    setLoading(false);
  };

  const handlePayment = async (metodo: "stripe" | "pix" | "mercadopago") => {
    setProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { cursoId, metodo },
      });

      if (error) throw error;

      if (metodo === "pix") {
        if (!data?.paymentId) {
          throw new Error("Não foi possível gerar o pagamento Pix");
        }
        setPixData({
          paymentId: data.paymentId,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
        });
      } else if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMercadoPagoSuccess = async (paymentId: string) => {
    try {
      setProcessing(true);

      const { error } = await supabase.functions.invoke("verify-mercadopago-payment", {
        body: { paymentId },
      });

      if (error) throw error;

      toast({
        title: "Pagamento confirmado!",
        description: "Seu certificado foi emitido com sucesso.",
      });

      if (user?.id) {
        fetchData(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyPixPayment = async () => {
    if (!pixData?.paymentId) return;

    setProcessing(true);

    try {
      const { error } = await supabase.functions.invoke("verify-mercadopago-payment", {
        body: { paymentId: pixData.paymentId },
      });

      if (error) throw error;

      toast({
        title: "Pagamento confirmado!",
        description: "Seu certificado foi emitido com sucesso.",
      });

      if (user?.id) {
        fetchData(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Pagamento ainda não confirmado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      toast({
        title: "Pix copiado",
        description: "O código Pix foi copiado para a área de transferência.",
      });
    } catch (error: any) {
      toast({
        title: "Não foi possível copiar",
        description: error?.message || "Tente copiar manualmente o código Pix.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificado) return;

    setProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { 
          cursoId,
          certificadoId: certificado.id 
        },
      });

      if (error) throw error;

      if (data?.pdf) {
        // Create download link
        const link = document.createElement("a");
        link.href = data.pdf;
        link.download = `certificado-${curso?.titulo.replace(/\s+/g, "-").toLowerCase()}.pdf`;
        link.click();

        toast({
          title: "Download iniciado",
          description: "Seu certificado está sendo baixado.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar certificado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 pb-20">
          <p className="text-center">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
        <div className="mb-8 text-center">
          <Award className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">Certificado de Conclusão</h1>
          <p className="text-lg text-muted-foreground">
            {curso?.titulo}
          </p>
        </div>

        {certificado?.pago ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Certificado Emitido</CardTitle>
              <CardDescription>
                Seu certificado foi gerado com sucesso!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Código de Validação:</p>
                <p className="font-mono font-bold">{certificado.codigo_validacao}</p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Data de Emissão:</p>
                <p className="font-semibold">
                  {new Date(certificado.emitido_em).toLocaleDateString("pt-BR")}
                </p>
              </div>

              <Button 
                onClick={handleDownloadCertificate}
                className="w-full"
                size="lg"
                disabled={processing}
              >
                <Download className="h-5 w-5 mr-2" />
                {processing ? "Gerando..." : "Baixar Certificado"}
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Voltar ao Painel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Emitir Certificado</CardTitle>
              <CardDescription>
                Finalize o pagamento para emitir seu certificado digital
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Curso:</span>
                  <span className="font-semibold">{curso?.titulo}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-muted-foreground">Carga Horária:</span>
                  <span className="font-semibold">{curso?.carga_horaria_horas || 0}h</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-lg font-semibold">Valor:</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {curso?.preco_certificado?.toFixed(2) || "39,00"}
                  </span>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">O certificado inclui:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Código de validação único</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Documento em PDF de alta qualidade</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Certificação conforme legislação vigente</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => handlePayment("stripe")}
                className="w-full"
                size="lg"
                disabled={processing}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {processing ? "Processando..." : "Pagar com Cartão (Stripe)"}
              </Button>

              <Button
                onClick={() => handlePayment("pix")}
                className="w-full"
                size="lg"
                variant="secondary"
                disabled={processing}
              >
                {processing ? "Gerando Pix..." : "Pagar com Pix (Mercado Pago)"}
              </Button>

              <Button
                onClick={() => handlePayment("mercadopago")}
                className="w-full"
                size="lg"
                variant="outline"
                disabled={processing}
              >
                {processing ? "Abrindo Mercado Pago..." : "Pagar com Mercado Pago"}
              </Button>

              {pixData && (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Escaneie o QR Code ou copie o código Pix para concluir o pagamento.
                  </div>
                  {pixData.qrCodeBase64 && (
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code Pix"
                        className="h-48 w-48"
                      />
                    </div>
                  )}
                  {pixData.qrCode && (
                    <div className="rounded bg-muted p-3 text-xs break-all font-mono">
                      {pixData.qrCode}
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleCopyPix} variant="outline" disabled={!pixData.qrCode}>
                      Copiar Pix
                    </Button>
                    {pixData.ticketUrl && (
                      <Button
                        onClick={() => window.open(pixData.ticketUrl, "_blank")}
                        variant="outline"
                      >
                        Abrir boleto/QR no navegador
                      </Button>
                    )}
                    <Button onClick={handleVerifyPixPayment} disabled={processing}>
                      Já paguei, verificar agora
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center">
                <p className="mb-2">
                  Certificação de cursos conforme Lei 9.394/96 e Decreto 5.154/04
                </p>
                <p>
                  Pagamento seguro processado via Stripe ou Mercado Pago
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PagamentoCertificado;
