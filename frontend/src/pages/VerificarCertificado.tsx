import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

type CertificadoPublico = {
  codigo_validacao: string;
  emitido_em: string | null;
  pago: boolean | null;
  curso_titulo: string | null;
  carga_horaria_horas: number | null;
  nome_completo: string | null;
};

export default function VerificarCertificado() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CertificadoPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { codigo: codigo.trim().toUpperCase() },
      });

      if (error) throw error;

      if (!data?.valid) {
        setErro('Codigo nao encontrado.');
        return;
      }

      setResultado(data.certificado as CertificadoPublico);
    } catch (error: any) {
      const message = error?.message || 'Nao foi possivel verificar o certificado.';
      setErro(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Validacao</p>
        <h1 className="headline-font text-3xl md:text-4xl">Verificar certificado</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Informe o codigo de validacao para confirmar a autenticidade.
        </p>
      </div>

      <div className="card space-y-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            className="input-field w-full"
            placeholder="Ex: MAEX-1729271234567-ABC123"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            required
          />
          <button type="submit" className="btn-accent w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        {erro && (
          <div className="rounded-[12px] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        {resultado && (
          <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Certificado valido</p>
              <span className="text-xs uppercase tracking-[0.3em]">
                {resultado.pago ? 'Pago' : 'Pendente'}
              </span>
            </div>
            <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <p><span className="text-[hsl(var(--foreground))]">Aluno:</span> {resultado.nome_completo || 'Nao informado'}</p>
              <p><span className="text-[hsl(var(--foreground))]">Curso:</span> {resultado.curso_titulo || 'Nao informado'}</p>
              <p>
                <span className="text-[hsl(var(--foreground))]">Carga horaria:</span>{' '}
                {resultado.carga_horaria_horas ? `${resultado.carga_horaria_horas}h` : 'Nao informada'}
              </p>
              <p>
                <span className="text-[hsl(var(--foreground))]">Data de emissao:</span>{' '}
                {resultado.emitido_em
                  ? new Date(resultado.emitido_em).toLocaleDateString('pt-BR')
                  : 'Nao informada'}
              </p>
              <p><span className="text-[hsl(var(--foreground))]">Codigo:</span> {resultado.codigo_validacao}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
