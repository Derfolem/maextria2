import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getValidAccessToken, supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const PLAN_OPTIONS = [
  { code: 'advanced', name: 'Plano avancado', price: 32.9, inputTokens: '6M', outputTokens: '1M' },
  { code: 'intermediate', name: 'Plano intermediario', price: 17.9, inputTokens: '3M', outputTokens: '800k' },
  { code: 'basic', name: 'Plano basico', price: 9.9, inputTokens: '1.5M', outputTokens: '400k' },
];

const PLAN_ORDER: Record<string, number> = {
  basic: 1,
  intermediate: 2,
  advanced: 3,
};

type StripePaymentFormProps = {
  onSuccess: (paymentIntentId: string) => Promise<void>;
  processing: boolean;
  setProcessing: (value: boolean) => void;
  priceLabel: string;
};

const StripePaymentForm = ({ onSuccess, processing, setProcessing, priceLabel }: StripePaymentFormProps) => {
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
        {processing ? 'Processando...' : `Pagar ${priceLabel} agora`}
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
  const [accessInfo, setAccessInfo] = useState<{ plan_code: string; expires_at: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('advanced');

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
        .from('ai_plan_access')
        .select('plan_code, expires_at')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (data?.expires_at) {
        setAccessInfo(data);
        return;
      }

      const { data: legacyAccess } = await supabase
        .from('ai_course_access')
        .select('granted_until')
        .eq('usuario_id', String(user.id))
        .maybeSingle();
      if (legacyAccess?.granted_until) {
        setAccessInfo({ plan_code: 'legacy', expires_at: legacyAccess.granted_until });
        return;
      }

      setAccessInfo(null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar acesso.');
    } finally {
      setLoading(false);
    }
  };

  const isAccessActive = () => {
    if (!accessInfo) return false;
    if (!accessInfo.expires_at) return false;
    return new Date(accessInfo.expires_at) > new Date();
  };

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    try {
      setProcessing(true);

      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Voce precisa estar logado para confirmar o pagamento.');
      }

      const { error } = await supabase.functions.invoke('verify-ai-plan-payment', {
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

      const { data, error } = await supabase.functions.invoke('create-ai-plan-payment', {
        body: { planCode: selectedPlan },
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
        <h1 className="headline-font text-4xl md:text-5xl">Area de criacao com IA</h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Escolha um plano mensal para liberar a criacao de imagens e textos.
          O limite nao acumula: ao renovar, o periodo e reiniciado.
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {PLAN_OPTIONS.map((plan) => (
            <button
              key={plan.code}
              type="button"
              onClick={() => setSelectedPlan(plan.code)}
              disabled={Boolean(clientSecret)}
              className={`rounded-[12px] border p-4 text-left transition ${
                selectedPlan === plan.code ? 'border-[hsl(var(--accent))] bg-[hsl(var(--muted))]' : 'border-[hsl(var(--border))]'
              }`}
            >
              <p className="font-semibold">{plan.name}</p>
              <p className="text-[hsl(var(--muted-foreground))]">
                {plan.inputTokens} entrada + {plan.outputTokens} saida
              </p>
              <p className="mt-2 font-semibold">R$ {plan.price.toFixed(2)}</p>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[hsl(var(--border))]">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="p-3 text-left">Plano</th>
                <th className="p-3 text-left">Tokens de entrada</th>
                <th className="p-3 text-left">Tokens de saida</th>
                <th className="p-3 text-left">Preco</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_OPTIONS.map((plan) => (
                <tr key={`row-${plan.code}`} className="border-t border-[hsl(var(--border))]">
                  <td className="p-3">{plan.name}</td>
                  <td className="p-3">{plan.inputTokens}</td>
                  <td className="p-3">{plan.outputTokens}</td>
                  <td className="p-3">R$ {plan.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {accessInfo && PLAN_ORDER[accessInfo.plan_code] && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {PLAN_ORDER[selectedPlan] === PLAN_ORDER[accessInfo.plan_code]
              ? 'Voce esta renovando o plano atual.'
              : PLAN_ORDER[selectedPlan] > PLAN_ORDER[accessInfo.plan_code]
                ? 'Voce esta fazendo upgrade de plano.'
                : 'Voce esta fazendo downgrade de plano.'}
          </p>
        )}
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          O limite e renovado por mes. Bloqueio acontece ao atingir o consumo ou completar 1 mes.
        </p>
      </div>

      {isAccessActive() && (
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">Acesso liberado</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Valido ate ${new Date(accessInfo?.expires_at ?? '').toLocaleDateString('pt-BR')}.
          </p>
          <button type="button" onClick={() => navigate('/teacher/ai-creator')} className="btn-accent">
            Area de criacao com IA
          </button>
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold">{isAccessActive() ? 'Renovar ou alterar plano' : 'Ativar agora'}</h2>
        {!clientSecret ? (
          <button type="button" onClick={handleCreateStripePayment} className="btn-accent" disabled={processing}>
            {processing ? 'Iniciando...' : `Gerar checkout de R$ ${PLAN_OPTIONS.find((plan) => plan.code === selectedPlan)?.price.toFixed(2)}`}
          </button>
        ) : (
          stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripePaymentForm
                onSuccess={handleStripePaymentSuccess}
                processing={processing}
                setProcessing={setProcessing}
                priceLabel={`R$ ${PLAN_OPTIONS.find((plan) => plan.code === selectedPlan)?.price.toFixed(2)}`}
              />
            </Elements>
          )
        )}
      </div>
    </div>
  );
}
