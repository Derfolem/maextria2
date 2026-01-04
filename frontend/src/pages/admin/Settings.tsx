import { useEffect, useState } from 'react';
import { SystemSettings } from '../../types';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { FaSave, FaPercent } from 'react-icons/fa';

export default function AdminSettings() {
  const [profitShare, setProfitShare] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      const adminShare = Number(response.data.admin_profit_share ?? 30);
      setProfitShare((100 - adminShare).toString());
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const value = parseFloat(profitShare);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error('Percentual deve estar entre 0 e 100');
      return;
    }

    setSaving(true);
    try {
      await api.put('/settings/profit-share', { admin_profit_share: 100 - value });
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Configuracoes</p>
        <h1 className="headline-font text-4xl md:text-5xl">Parametros do sistema</h1>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Configuracoes financeiras</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Percentual de Repasse aos Professores
            </label>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
              Defina qual percentual da venda será repassado aos professores. O restante fica com a plataforma.
            </p>
            <div className="relative max-w-xs">
              <FaPercent className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={profitShare}
                onChange={(e) => setProfitShare(e.target.value)}
                className="input-field pr-10"
                placeholder="0.00"
                required
              />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Exemplo: Se definir 70%, o professor recebe 70% e a plataforma 30% de cada venda.
            </p>
          </div>

          <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg p-4">
            <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Simulacao</h3>
            <div className="space-y-1 text-sm text-[hsl(var(--muted-foreground))]">
              <p>Para uma venda de R$ 100,00:</p>
              <p>• Professor recebe: R$ {((parseFloat(profitShare) || 0) * 100 / 100).toFixed(2)}</p>
              <p>• Plataforma recebe: R$ {((100 - (parseFloat(profitShare) || 0)) * 100 / 100).toFixed(2)}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-accent flex items-center space-x-2"
          >
            <FaSave />
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </form>
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-semibold mb-4">Outras configuracoes</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-lg">
            <div>
              <h3 className="font-semibold">Modo de Manutenção</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Desabilitar acesso temporariamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--muted))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--accent))]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-[hsl(var(--muted))] rounded-lg">
            <div>
              <h3 className="font-semibold">Novos Cadastros</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Permitir registro de novos usuários</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--muted))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary))]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
