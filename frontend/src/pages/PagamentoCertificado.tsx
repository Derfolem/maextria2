import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getValidAccessToken, supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Certificado {
  id: string;
  pago: boolean;
  codigo_validacao: string;
  emitido_em: string;
}

export default function PagamentoCertificado() {
  const { cursoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [curso, setCurso] = useState<any>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'stripe' | 'pix' | 'mercadopago' | null>(null);

  const [pixData, setPixData] = useState<{
    paymentId: string;
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cursoId) {
      fetchData(String(user.id), cursoId);
    }
  }, [user, cursoId, navigate]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const mpStatus = searchParams.get('mp');
    const mpPaymentId =
      searchParams.get('payment_id') ||
      searchParams.get('collection_id') ||
      searchParams.get('paymentId');

    if (paymentStatus === 'success' && user) {
      handlePaymentSuccess();
      return;
    }

    if (paymentStatus === 'canceled') {
      toast.error('Pagamento cancelado. Você pode tentar novamente.');
      return;
    }

    if (mpStatus === 'success' && mpPaymentId && user) {
      handleMercadoPagoSuccess(mpPaymentId);
      return;
    }

    if (mpStatus === 'pending') {
      toast('Pagamento pendente. Aguarde a confirmação.');
      return;
    }

    if (mpStatus === 'failure') {
      toast.error('Pagamento não aprovado. Tente novamente.');
    }
  }, [searchParams, user]);

  const fetchData = async (userId: string | number, courseId: string) => {
    setLoading(true);
    try {
      const userIdString = String(userId);
      const { data: courseData, error: courseError } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCurso(courseData);

      const { data: certData } = await supabase
        .from('certificados')
        .select('*')
        .eq('usuario_id', userIdString)
        .eq('curso_id', courseId)
        .maybeSingle();

      if (certData) {
        setCertificado(certData);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados do certificado.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user || !cursoId) return;

    try {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        toast('Pagamento em processamento. Atualize a pagina em alguns instantes.');
        return;
      }

      setProcessing(true);
      setProcessingMethod('stripe');

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;

      toast.success('Pagamento confirmado! Seu certificado foi emitido.');
      fetchData(String(user.id), cursoId);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao confirmar pagamento.');
    } finally {
      setProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleMercadoPagoSuccess = async (paymentId: string) => {
    if (!user || !cursoId) return;

    try {
      setProcessing(true);
      setProcessingMethod('mercadopago');

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-mercadopago-payment', {
        body: { paymentId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;

      toast.success('Pagamento confirmado! Seu certificado foi emitido.');
      fetchData(String(user.id), cursoId);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao confirmar pagamento.');
    } finally {
      setProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handlePayment = async (metodo: 'stripe' | 'pix' | 'mercadopago') => {
    if (!cursoId) return;
    setProcessing(true);
    setProcessingMethod(metodo);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para iniciar o pagamento.');
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { cursoId, metodo },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;

      if (metodo === 'pix') {
        if (!data?.paymentId) throw new Error('Nao foi possivel gerar o Pix');
        setPixData({
          paymentId: data.paymentId,
          qrCode: data.qrCode,
          qrCodeBase64: data.qrCodeBase64,
          ticketUrl: data.ticketUrl,
        });
      } else if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao iniciar pagamento.');
    } finally {
      setProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleVerifyPixPayment = async () => {
    if (!pixData?.paymentId) return;

    setProcessing(true);
    setProcessingMethod('pix');

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-mercadopago-payment', {
        body: { paymentId: pixData.paymentId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) throw error;

      toast.success('Pagamento confirmado! Seu certificado foi emitido.');
      if (user && cursoId) {
        fetchData(String(user.id), cursoId);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Pagamento ainda nao confirmado.');
    } finally {
      setProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      toast.success('Codigo Pix copiado.');
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel copiar o Pix.');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificado || !cursoId) return;

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          cursoId,
          certificadoId: certificado.id,
        },
      });

      if (error) throw error;

      if (data?.pdf) {
        const link = document.createElement('a');
        link.href = data.pdf;
        link.download = `certificado-${curso?.titulo?.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        link.click();
        toast.success('Download iniciado.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao gerar certificado.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Certificado</p>
        <h1 className="headline-font text-3xl md:text-4xl">Pagamento do certificado</h1>
        <p className="text-[hsl(var(--muted-foreground))]">{curso?.titulo}</p>
      </div>

      {certificado?.pago ? (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Codigo de validacao</p>
              <p className="font-mono font-semibold">{certificado.codigo_validacao}</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-[hsl(var(--secondary))] px-3 py-1 text-xs uppercase tracking-[0.3em] text-[hsl(var(--foreground))]">
              Pago
            </span>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Emitido em {new Date(certificado.emitido_em).toLocaleDateString('pt-BR')}
          </p>
          <button type="button" className="btn-accent" onClick={handleDownloadCertificate} disabled={processing}>
            {processing ? 'Gerando...' : 'Baixar certificado'}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate('/student/dashboard')}>
            Voltar ao painel
          </button>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--muted-foreground))]">Curso:</span>
              <span className="font-semibold">{curso?.titulo}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2">
              <span className="text-[hsl(var(--muted-foreground))]">Carga horaria:</span>
              <span className="font-semibold">{curso?.carga_horaria_horas || 0}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Valor:</span>
              <span className="text-2xl font-semibold text-[hsl(var(--primary))]">
                R$ {curso?.preco_certificado?.toFixed(2) || '39,00'}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            <p>Certificado digital com codigo unico de validacao.</p>
            <p>Documento PDF pronto para download apos confirmacao do pagamento.</p>
          </div>

          <div className="grid gap-3">
            <button type="button" className="btn-accent" onClick={() => handlePayment('stripe')} disabled={processing}>
              {processingMethod === 'stripe' ? 'Processando...' : 'Pagar com Cartao (Stripe)'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => handlePayment('pix')} disabled={processing}>
              {processingMethod === 'pix' ? 'Gerando Pix...' : 'Pagar com Pix (Mercado Pago)'}
            </button>
            <button type="button" className="btn-outline" onClick={() => handlePayment('mercadopago')} disabled={processing}>
              {processingMethod === 'mercadopago' ? 'Abrindo Mercado Pago...' : 'Pagar com Mercado Pago'}
            </button>
          </div>

          {pixData && (
            <div className="rounded-[12px] border border-[hsl(var(--border))] p-4 space-y-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Escaneie o QR Code ou copie o codigo Pix para concluir o pagamento.
              </p>
              {pixData.qrCodeBase64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="h-40 w-40"
                  />
                </div>
              )}
              {pixData.qrCode && (
                <div className="rounded-[10px] bg-[hsl(var(--muted))] p-3 text-xs break-all font-mono">
                  {pixData.qrCode}
                </div>
              )}
              <div className="grid gap-2">
                <button type="button" className="btn-outline" onClick={handleCopyPix} disabled={!pixData.qrCode}>
                  Copiar Pix
                </button>
                {pixData.ticketUrl && (
                  <button type="button" className="btn-outline" onClick={() => window.open(pixData.ticketUrl, '_blank')}>
                    Abrir boleto/QR no navegador
                  </button>
                )}
                <button type="button" className="btn-accent" onClick={handleVerifyPixPayment} disabled={processing}>
                  Ja paguei, verificar agora
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Pagamento seguro processado via Stripe ou Mercado Pago.
          </p>
        </div>
      )}
    </div>
  );
}
