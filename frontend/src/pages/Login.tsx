import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';
import { FaEnvelope, FaLock, FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getRememberMeDefault, supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(getRememberMeDefault());
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      toast.success('Login realizado com sucesso!');
      const user = useAuthStore.getState().user;

      if (user?.role === 'student') {
        navigate('/student/dashboard');
      } else if (user?.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error('Informe seu email para recuperar a senha.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw error;
      }
      toast.success('Enviamos um link de redefinição para o seu email.');
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel enviar o link de redefinicao.');
    }
  };

  const handleGoogleLogin = async () => {
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
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Login</p>
          <h2 className="headline-font text-3xl">Bem-vindo de volta</h2>
          <p className="text-[hsl(var(--muted-foreground))]">Acesse sua conta MAEXTRIA</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full btn-outline flex items-center justify-center gap-3 py-3"
          >
            <FaGoogle />
            <span>Entrar com Google</span>
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
              />
            </div>
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[hsl(var(--primary))]"
              />
              Me mantenha conectado a este dispositivo
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] font-semibold"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-[hsl(var(--primary))] hover:text-[hsl(var(--foreground))] font-semibold">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
