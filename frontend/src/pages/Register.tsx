import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaLock, FaHourglassHalf, FaGoogle, FaEye, FaEyeSlash, FaIdCard } from 'react-icons/fa';
import { supabase } from '../lib/supabase';
import { formatCpf, isValidCpf, normalizeCpf } from '../lib/validators';
import { trackSignUp } from '../lib/analytics';
import { trackMarketingEvent } from '../lib/marketing';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfTouched, setCpfTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);
  const [blockedPulse, setBlockedPulse] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase
          .from('configuracoes_site')
          .select('chave, valor')
          .eq('chave', 'allow_new_signups')
          .maybeSingle();
        if (data?.valor === '0') {
          setAllowNewSignups(false);
        }
      } catch (error) {
        setAllowNewSignups(true);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowNewSignups) {
      toast.error('Novos cadastros estão temporariamente fechados.');
      setBlockedPulse(true);
      window.setTimeout(() => setBlockedPulse(false), 800);
      return;
    }
    const normalizedCpf = normalizeCpf(cpf);
    if (!isValidCpf(normalizedCpf)) {
      setCpfTouched(true);
      toast.error('CPF inválido. Verifique e tente novamente.');
      return;
    }
    setLoading(true);

    try {
      const result = await register(name, email, password, normalizedCpf);
      trackSignUp('email');
      void trackMarketingEvent('signup_success', {
        metadata: {
          method: 'email',
          needsEmailConfirmation: Boolean(result.needsEmailConfirmation),
        },
      });
      if (result.needsEmailConfirmation) {
        toast.success('Conta criada! Verifique seu email e complete seu cadastro ao entrar.');
        navigate('/login');
      } else {
        toast.success('Conta criada com sucesso! Complete seu cadastro para continuar.');
        navigate('/settings?complete=1');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!allowNewSignups) {
      toast.error('Novos cadastros estão temporariamente fechados.');
      setBlockedPulse(true);
      window.setTimeout(() => setBlockedPulse(false), 800);
      return;
    }
    toast.error('Cadastro com Google indisponível. Informe seu CPF para criar a conta.');
    return;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel entrar com Google.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--accent))]">Cadastro</p>
          <h2 className="headline-font text-3xl">Criar sua conta</h2>
          <p className="text-[hsl(var(--muted-foreground))] mt-2">Comece sua jornada na MAEXTRIA</p>
        </div>
        {!allowNewSignups && !configLoading && (
          <div
            className={`rounded-2xl border p-4 text-sm mb-6 flex items-center justify-between gap-4 transition ${
              blockedPulse
                ? 'bg-red-50 border-red-300 text-red-700 shadow-[0_0_0_3px_rgba(248,113,113,0.2)]'
                : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            <span className="flex items-center gap-2">
              <FaHourglassHalf className="text-[hsl(var(--accent))] animate-spin" />
              <span>No momento não estamos aceitando novos cadastros.</span>
            </span>
            <div className="flex items-center gap-1 text-[hsl(var(--accent))]">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={!allowNewSignups || configLoading}
            className="w-full btn-outline flex items-center justify-center gap-3 py-3"
          >
            <FaGoogle />
            <span>Continuar com Google</span>
          </button>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex-1 h-px bg-[hsl(var(--border))]" />
            <span>ou</span>
            <span className="flex-1 h-px bg-[hsl(var(--border))]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo
            </label>
            <div className="relative">
              <FaUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
                placeholder="Seu nome"
                required
                disabled={!allowNewSignups || configLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="seu@email.com"
                required
                disabled={!allowNewSignups || configLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF
            </label>
            <div className="relative">
              <FaIdCard className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                onBlur={() => setCpfTouched(true)}
                className={`input-field pl-10 ${cpfTouched && !isValidCpf(cpf) ? 'border-red-400 focus:border-red-500' : ''}`}
                placeholder="000.000.000-00"
                required
                disabled={!allowNewSignups || configLoading}
              />
            </div>
            {cpfTouched && !isValidCpf(cpf) && (
              <p className="mt-2 text-xs text-red-600">Informe um CPF válido.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-10"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={!allowNewSignups || configLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                disabled={!allowNewSignups || configLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !allowNewSignups || configLoading}
            className="w-full btn-primary py-3"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] font-semibold">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
