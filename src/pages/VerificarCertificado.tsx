import { useState, type FormEvent } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type CertificadoPublico = {
  codigo_validacao: string;
  emitido_em: string | null;
  pago: boolean | null;
  curso_titulo: string | null;
  carga_horaria_horas: number | null;
  nome_completo: string | null;
};

const VerificarCertificado = () => {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CertificadoPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-certificate", {
        body: { codigo: codigo.trim().toUpperCase() },
      });

      if (error) throw error;

      if (!data?.valid) {
        setErro("Código não encontrado.");
        return;
      }

      setResultado(data.certificado as CertificadoPublico);
    } catch (error: any) {
      setErro(error.message || "Não foi possível verificar o certificado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-20 max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Verificar Certificado</CardTitle>
            <CardDescription>
              Informe o código de validação para confirmar a autenticidade do certificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                placeholder="Ex: MAEX-1729271234567-ABC123"
                value={codigo}
                onChange={(event) => setCodigo(event.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Verificar"}
              </Button>
            </form>

            {erro && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {erro}
              </div>
            )}

            {resultado && (
              <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Certificado válido</p>
                  <Badge>{resultado.pago ? "Pago" : "Pendente"}</Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="text-foreground">Aluno:</span>{" "}
                    {resultado.nome_completo || "Não informado"}
                  </p>
                  <p>
                    <span className="text-foreground">Curso:</span>{" "}
                    {resultado.curso_titulo || "Não informado"}
                  </p>
                  <p>
                    <span className="text-foreground">Carga horária:</span>{" "}
                    {resultado.carga_horaria_horas ? `${resultado.carga_horaria_horas}h` : "Não informada"}
                  </p>
                  <p>
                    <span className="text-foreground">Data de emissão:</span>{" "}
                    {resultado.emitido_em
                      ? new Date(resultado.emitido_em).toLocaleDateString("pt-BR")
                      : "Não informada"}
                  </p>
                  <p>
                    <span className="text-foreground">Código:</span> {resultado.codigo_validacao}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerificarCertificado;
