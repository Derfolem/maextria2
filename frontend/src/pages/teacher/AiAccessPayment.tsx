import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getValidAccessToken, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

type StripePaymentFormProps = {
  onSuccess: (paymentIntentId: string) => Promise<void>;
  processing: boolean;
  setProcessing: (value: boolean) => void;
};

const StripePaymentForm = ({ onSuccess, processing, setProcessing }: StripePaymentFormProps) => {
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
        {processing ? 'Processando...' : 'Pagar R$ 25,00 agora'}
      </button>
    </form>
  );
};

export default function AiAccessPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  const buildAuthHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
    ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeVerified, setStripeVerified] = useState(false);
  const [accessInfo, setAccessInfo] = useState<{ granted_until: string | null; granted_by_admin: boolean } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadAccess();
  }, [user, navigate]);

  useEffect(() => {
    const paymentIntentFromUrl = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'failed') {
      toast.error('Pagamento nao aprovado. Tente novamente.');
    }

    if (paymentIntentFromUrl && user && !stripeVerified) {
      setStripeVerified(true);
      handleStripePaymentSuccess(paymentIntentFromUrl);
    }
  }, [searchParams, user, stripeVerified]);

  const loadAccess = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('ai_course_access')
        .select('granted_until, granted_by_admin')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      setAccessInfo(data ?? null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const isAccessActive = () => {
    if (!accessInfo) return false;
    if (accessInfo.granted_by_admin) return true;
    if (!accessInfo.granted_until) return false;
    return new Date(accessInfo.granted_until) > new Date();
  };

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setProcessing(true);

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-ai-access-payment', {
        body: { paymentIntentId },
        headers: buildAuthHeaders(accessToken),
      });

      if (error) throw error;

      toast.success('Pagamento confirmado! Seu acesso foi liberado.');
      await loadAccess();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao confirmar pagamento.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateStripePayment = async () => {
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

      const { data, error } = await supabase.functions.invoke('create-ai-access-payment', {
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="card space-y-4">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">
          Acesso IA para professores
        </p>
        <h1 className="headline-font text-4xl md:text-5xl">Gerador de cursos com IA</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Libere o motor de IA por apenas R$ 25,00 e ganhe 30 dias para transformar PDFs e
          HTML em cursos completos, com modulos, aulas e questionarios prontos.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
            <p className="font-semibold">Mais velocidade</p>
            <p className="text-[hsl(var(--muted-foreground))]">
              Monte o esqueleto do curso em minutos com base em materiais reais.
            </p>
          </div>
          <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
            <p className="font-semibold">Qualidade consistente</p>
            <p className="text-[hsl(var(--muted-foreground))]">
              Estrutura alinhada, aulas organizadas e quizzes prontos para publicar.
            </p>
          </div>
          <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
            <p className="font-semibold">Mais conversao</p>
            <p className="text-[hsl(var(--muted-foreground))]">
              Lance cursos mais rapido e teste novos temas sem travar sua agenda.
            </p>
          </div>
        </div>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Para liberar a funcao de IA, e necessario confirmar o pagamento de R$ 25,00.
        </p>
      </div>

      {isAccessActive() ? (
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">Acesso liberado</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            {accessInfo?.granted_by_admin
              ? 'Seu acesso foi liberado pelo admin.'
              : `Valido ate ${new Date(accessInfo?.granted_until ?? '').toLocaleDateString('pt-BR')}.`}
          </p>
          <button type="button" onClick={() => navigate('/teacher/course/new')} className="btn-accent">
            Criar curso com IA
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold">Ativar agora</h2>
          {!clientSecret ? (
            <button type="button" onClick={handleCreateStripePayment} className="btn-accent" disabled={processing}>
              {processing ? 'Iniciando...' : 'Gerar checkout de R$ 25,00'}
            </button>
          ) : (
            stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripePaymentForm
                  onSuccess={handleStripePaymentSuccess}
                  processing={processing}
                  setProcessing={setProcessing}
                />
              </Elements>
            )
          )}
        </div>
      )}
    </div>
  );
}
