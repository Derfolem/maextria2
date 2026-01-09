import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaLock } from 'react-icons/fa';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(Boolean(data.session));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas nao conferem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
      }
      toast.success('Senha atualizada com sucesso.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.message || 'Nao foi possivel atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-md w-full card p-8">
        <div className="text-center mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Recuperacao</p>
          <h2 className="headline-font text-3xl">Redefinir senha</h2>
          <p className="text-[hsl(var(--muted-foreground))]">Crie uma nova senha para acessar sua conta</p>
        </div>

        {sessionReady === null && (
          <div className="text-center text-[hsl(var(--muted-foreground))]">
            Verificando link de redefinicao...
          </div>
        )}

        {sessionReady === false && (
          <div className="text-center space-y-4">
            <p className="text-[hsl(var(--muted-foreground))]">
              Este link de redefinicao e invalido ou expirou.
            </p>
            <button type="button" className="btn-primary w-full" onClick={() => navigate('/login')}>
              Voltar para o login
            </button>
          </div>
        )}

        {sessionReady && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova senha
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3"
            >
              {loading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
