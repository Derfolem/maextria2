import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface Question {
  id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  correta: string;
}

const Prova = () => {
  const { cursoId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ acertos: number; percentual: number; aprovado: boolean } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
  }, [navigate]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!cursoId) return;

      const { data } = await supabase
        .from("prova_questoes")
        .select("*")
        .eq("curso_id", cursoId);

      if (data) {
        setQuestions(data);
      }
    };

    fetchQuestions();
  }, [cursoId]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast.error("Por favor, responda todas as questões");
      return;
    }

    let acertos = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correta) {
        acertos++;
      }
    });

    const percentual = (acertos / questions.length) * 100;
    const aprovado = percentual >= 60;

    const { error } = await supabase
      .from("prova_resultado")
      .upsert({
        usuario_id: user.id,
        curso_id: cursoId,
        total_questoes: questions.length,
        acertos,
        percentual,
        aprovado,
      }, { onConflict: "usuario_id,curso_id" });

    if (error) {
      toast.error("Erro ao salvar resultado");
    } else {
      setResult({ acertos, percentual, aprovado });
      setSubmitted(true);
      
      if (aprovado) {
        toast.success("Parabéns! Você foi aprovado!");
      } else {
        toast.error("Você não atingiu a nota mínima de 60%");
      }
    }
  };

  if (!questions.length) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Avaliação Final</h1>
          <p className="text-lg text-muted-foreground">
            Responda todas as questões. Você precisa de 60% de acertos para ser aprovado.
          </p>
        </div>

        {!submitted ? (
          <>
            <div className="space-y-6 mb-8">
              {questions.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Questão {index + 1}
                    </CardTitle>
                    <CardDescription className="text-base text-foreground">
                      {question.enunciado}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={answers[question.id]}
                      onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}
                    >
                      {["a", "b", "c", "d"].map((option) => (
                        <div key={option} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={option} id={`${question.id}-${option}`} />
                          <Label 
                            htmlFor={`${question.id}-${option}`}
                            className="flex-1 cursor-pointer"
                          >
                            {option.toUpperCase()}) {question[`alternativa_${option}` as keyof Question]}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button 
                variant="hero" 
                size="lg"
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
              >
                Finalizar e ver resultado
              </Button>
            </div>
          </>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {result?.aprovado ? (
                  <CheckCircle2 className="h-8 w-8 text-white" />
                ) : (
                  <XCircle className="h-8 w-8 text-white" />
                )}
              </div>
              <CardTitle className="text-3xl">
                {result?.aprovado ? "Parabéns!" : "Não foi dessa vez"}
              </CardTitle>
              <CardDescription className="text-lg">
                {result?.aprovado 
                  ? "Você foi aprovado na avaliação!" 
                  : "Você precisa de 60% para ser aprovado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center text-lg">
                  <span>Acertos</span>
                  <span className="font-bold">{result?.acertos} de {questions.length}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>Nota final</span>
                  <span className={`font-bold text-2xl ${result?.aprovado ? "text-secondary" : "text-destructive"}`}>
                    {result?.percentual.toFixed(0)}%
                  </span>
                </div>
              </div>

              {result?.aprovado ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-secondary/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      Para emitir seu certificado, você precisará fazer o pagamento de uma taxa de emissão.
                    </p>
                  </div>
                  <Button variant="hero" className="w-full" onClick={() => navigate(`/pagamento-certificado/${cursoId}`)}>
                    Prosseguir para Pagamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      Você pode tentar novamente quantas vezes quiser. Revise o conteúdo e tente de novo!
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Prova;
