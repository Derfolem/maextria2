import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

export default function PagamentoCertificado() {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [curso, setCurso] = useState<any>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    fetchData();
  }, [cursoId]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Buscar curso
    const { data: cursoData } = await supabase
      .from("cursos")
      .select("*")
      .eq("id", cursoId)
      .single();

    // Buscar resultado da prova
    const { data: resultadoData } = await supabase
      .from("prova_resultado")
      .select("*")
      .eq("curso_id", cursoId)
      .eq("usuario_id", user.id)
      .order("realizado_em", { ascending: false })
      .limit(1)
      .single();

    if (!resultadoData || !resultadoData.aprovado) {
      toast({
        title: "Acesso negado",
        description: "Você precisa ser aprovado na prova para emitir o certificado.",
        variant: "destructive",
      });
      navigate(`/curso/${cursoData?.slug}`);
      return;
    }

    setCurso(cursoData);
    setResultado(resultadoData);
  };

  const processarPagamento = async () => {
    setProcessando(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Simular processamento de pagamento
    // Em produção, aqui você integraria com gateway de pagamento (Stripe, PagSeguro, etc.)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Gerar código de validação único
    const codigoValidacao = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Criar registro de certificado
    const { error } = await supabase.from("certificados").insert({
      usuario_id: user.id,
      curso_id: cursoId,
      codigo_validacao: codigoValidacao,
      pago: true,
      emitido_em: new Date().toISOString(),
    });

    setProcessando(false);

    if (error) {
      toast({
        title: "Erro ao processar pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Seu certificado foi emitido e está disponível no dashboard.",
      });
      navigate("/dashboard");
    }
  };

  if (!curso) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p>Carregando...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <Award className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Emissão de Certificado</CardTitle>
                  <p className="text-muted-foreground">{curso.titulo}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Parabéns! Você foi aprovado</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nota obtida:</p>
                    <p className="font-bold text-lg">{resultado?.percentual}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Acertos:</p>
                    <p className="font-bold text-lg">
                      {resultado?.acertos} de {resultado?.total_questoes}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Detalhes do Certificado</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Curso:</span>{" "}
                    <span className="font-medium">{curso.titulo}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Carga horária:</span>{" "}
                    <span className="font-medium">{curso.carga_horaria_horas}h</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Taxa de emissão:</span>{" "}
                    <span className="font-medium text-lg">R$ 39,90</span>
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 text-sm">
                <p className="text-blue-900 dark:text-blue-100">
                  📄 Seu certificado será gerado em formato PDF e ficará disponível para download
                  no seu dashboard após a confirmação do pagamento.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={processarPagamento}
                  disabled={processando}
                  className="flex-1"
                >
                  {processando ? "Processando..." : "Confirmar Pagamento (R$ 39,90)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={processando}
                >
                  Voltar
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Em produção, aqui será integrado um gateway de pagamento seguro
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
