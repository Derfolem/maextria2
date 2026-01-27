import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getValidAccessToken, supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store';

interface Certificado {
  id: string;
  pago: boolean;
  codigo_validacao: string;
  emitido_em: string;
}

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type StripePaymentFormProps = {
  onSuccess: (paymentIntentId: string) => Promise<void>;
  processing: boolean;
  setProcessing: (value: boolean) => void;
};

const StripePaymentForm = ({
  onSuccess,
  processing,
  setProcessing,
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('O Stripe ainda nao esta pronto. Tente novamente.');
      return;
    }

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Nao foi possivel processar o pagamento.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      await onSuccess(paymentIntent.id);
      setProcessing(false);
      return;
    }

    toast('Pagamento em processamento. Atualize a pagina em instantes.');
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button type="submit" className="btn-accent" disabled={!stripe || processing}>
        {processing ? 'Processando...' : 'Pagar agora'}
      </button>
    </form>
  );
};

export default function PagamentoCertificado() {
  const { cursoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const buildAuthHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
    ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
  });
  const [curso, setCurso] = useState<any>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeVerified, setStripeVerified] = useState(false);

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
    const paymentIntentFromUrl = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'failed') {
      toast.error('Pagamento não aprovado. Tente novamente.');
    }

    if (paymentIntentFromUrl && user && !stripeVerified) {
      setStripeVerified(true);
      handleStripePaymentSuccess(paymentIntentFromUrl);
    }
  }, [searchParams, user, stripeVerified]);

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

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    if (!user || !cursoId) return;

    try {
      setProcessing(true);

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-payment', {
        body: { paymentIntentId },
        headers: buildAuthHeaders(accessToken),
      });

      if (error) throw error;

      toast.success('Pagamento confirmado! Seu certificado foi emitido.');
      fetchData(String(user.id), cursoId);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao confirmar pagamento.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateStripePayment = async () => {
    if (!cursoId) return;

    if (!stripePromise) {
      toast.error('Stripe nao configurado. Defina VITE_STRIPE_PUBLISHABLE_KEY.');
      return;
    }

    setProcessing(true);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para iniciar o pagamento.');
      }

      const referralId = typeof window !== 'undefined' ? window.localStorage.getItem('mae_referral_id') : null;
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { cursoId, metodo: 'stripe', referralId },
        headers: buildAuthHeaders(accessToken),
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.clientSecret) {
        throw new Error('Nao foi possivel iniciar o pagamento.');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao iniciar pagamento.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!certificado || !cursoId) return;

    setProcessing(true);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para gerar o certificado.');
      }

      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          cursoId,
          certificadoId: certificado.id,
        },
        headers: buildAuthHeaders(accessToken),
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
            {!clientSecret && (
              <button type="button" className="btn-accent" onClick={handleCreateStripePayment} disabled={processing}>
                {processing ? 'Iniciando...' : 'Continuar para pagamento com cartao'}
              </button>
            )}
            {clientSecret && stripePromise && (
              <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
                <Elements
                  key={clientSecret}
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: { theme: 'stripe' },
                  }}
                >
                  <StripePaymentForm
                    onSuccess={handleStripePaymentSuccess}
                    processing={processing}
                    setProcessing={setProcessing}
                  />
                </Elements>
              </div>
            )}
          </div>

          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Pagamento seguro processado via Stripe.
          </p>
        </div>
      )}
    </div>
  );
}
