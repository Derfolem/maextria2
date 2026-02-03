import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaSave, FaPercent, FaBullhorn, FaCode, FaSearch, FaChartLine } from 'react-icons/fa';

export default function AdminSettings() {
  const [minScore, setMinScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [marketingSaving, setMarketingSaving] = useState(false);
  const [aiDefaultLimit, setAiDefaultLimit] = useState('');
  const [aiDefaultSaving, setAiDefaultSaving] = useState(false);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [allowNewSignups, setAllowNewSignups] = useState(true);
  const [signupsSaving, setSignupsSaving] = useState(false);
  const [aiUsageRows, setAiUsageRows] = useState<Array<{
    userId: string;
    name: string;
    email: string;
    totalUsd: number;
    limitUsd: number;
  }>>([]);
  const [aiLimitEdits, setAiLimitEdits] = useState<Record<string, string>>({});
  const [aiLimitSaving, setAiLimitSaving] = useState<Record<string, boolean>>({});
  const [marketing, setMarketing] = useState({
    bannerEnabled: false,
    bannerImageUrl: '',
    bannerLinkUrl: '',
    bannerAlt: 'Banner promocional',
    pixelHead: '',
    pixelBody: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    seoRobots: 'index,follow',
    seoCanonical: '',
    backlinks: '',
    teacherBannerEnabled: false,
    teacherBannerImageUrl: '',
    teacherBannerLinkUrl: '',
    teacherBannerAlt: 'Banner para professores',
  });

  useEffect(() => {
    loadSettings();
    loadMarketing();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_site')
        .select('chave, valor')
        .in('chave', [
          'nota_minima_prova',
          'ai_monthly_limit_usd',
          'maintenance_mode',
          'allow_new_signups',
        ]);
      if (error) throw error;
      const notaMinima = Number(data?.find((item: any) => item.chave === 'nota_minima_prova')?.valor ?? 60);
      const defaultLimit = data?.find((item: any) => item.chave === 'ai_monthly_limit_usd')?.valor ?? '5';
      const maintenanceValue = data?.find((item: any) => item.chave === 'maintenance_mode')?.valor ?? '0';
      const signupValue = data?.find((item: any) => item.chave === 'allow_new_signups')?.valor ?? '1';
      setMinScore(notaMinima.toString());
      setAiDefaultLimit(defaultLimit);
      setMaintenanceMode(maintenanceValue === '1');
      setAllowNewSignups(signupValue !== '0');
    } catch (error) {
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const loadMarketing = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_site')
        .select('chave, valor')
        .in('chave', [
          'marketing_banner_enabled',
          'marketing_banner_image_url',
          'marketing_banner_link_url',
          'marketing_banner_alt',
          'marketing_pixel_head',
          'marketing_pixel_body',
          'seo_meta_title',
          'seo_meta_description',
          'seo_meta_keywords',
          'seo_meta_robots',
          'seo_canonical_url',
          'marketing_backlinks',
          'teacher_banner_enabled',
          'teacher_banner_image_url',
          'teacher_banner_link_url',
          'teacher_banner_alt',
        ]);
      if (error) throw error;
      const resolve = (key: string) => data?.find((item: any) => item.chave === key)?.valor ?? '';
      setMarketing({
        bannerEnabled: resolve('marketing_banner_enabled') === '1',
        bannerImageUrl: resolve('marketing_banner_image_url'),
        bannerLinkUrl: resolve('marketing_banner_link_url'),
        bannerAlt: resolve('marketing_banner_alt') || 'Banner promocional',
        pixelHead: resolve('marketing_pixel_head'),
        pixelBody: resolve('marketing_pixel_body'),
        seoTitle: resolve('seo_meta_title'),
        seoDescription: resolve('seo_meta_description'),
        seoKeywords: resolve('seo_meta_keywords'),
        seoRobots: resolve('seo_meta_robots') || 'index,follow',
        seoCanonical: resolve('seo_canonical_url'),
        backlinks: resolve('marketing_backlinks'),
        teacherBannerEnabled: resolve('teacher_banner_enabled') === '1',
        teacherBannerImageUrl: resolve('teacher_banner_image_url'),
        teacherBannerLinkUrl: resolve('teacher_banner_link_url'),
        teacherBannerAlt: resolve('teacher_banner_alt') || 'Banner para professores',
      });
    } catch (error) {
      toast.error('Erro ao carregar marketing');
    } finally {
      setMarketingLoading(false);
    }
  };

  const handleMarketingChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';
    setMarketing((prev) => ({
      ...prev,
      [name]: isCheckbox ? target.checked : value,
    }));
  };

  const handleSaveAiDefaultLimit = async () => {
    setAiDefaultSaving(true);
    try {
      const payload = [
        { chave: 'ai_monthly_limit_usd', valor: aiDefaultLimit || '5' },
      ];
      const { error } = await supabase
        .from('configuracoes_site')
        .upsert(payload, { onConflict: 'chave' });
      if (error) throw error;
      toast.success('Limite mensal atualizado!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar limite mensal.');
    } finally {
      setAiDefaultSaving(false);
    }
  };

  const loadAiUsage = async () => {
    setAiUsageLoading(true);
    try {

      const [{ data: usageData }, { data: usersData }, { data: rolesData }, { data: limitsData }, { data: planAccess }] = await Promise.all([
        supabase
          .from('ai_usage_periods')
          .select('usuario_id, total_usd, period_end')
          .gte('period_end', new Date().toISOString()),
        supabase.from('usuarios').select('id, nome_completo, email'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('ai_usage_limits').select('usuario_id, limit_usd'),
        supabase.from('ai_plan_access').select('usuario_id, limit_usd'),
      ]);

      const rolesMap = (rolesData || []).reduce((acc: Record<string, string[]>, row: any) => {
        const key = String(row.user_id);
        acc[key] = acc[key] || [];
        acc[key].push(row.role);
        return acc;
      }, {});

      const usageMap = (usageData || []).reduce((acc: Record<string, number>, row: any) => {
        const key = String(row.usuario_id);
        acc[key] = Math.max(acc[key] || 0, Number(row.total_usd || 0));
        return acc;
      }, {});

      const planLimitMap = (planAccess || []).reduce((acc: Record<string, number>, row: any) => {
        acc[String(row.usuario_id)] = Number(row.limit_usd || 0);
        return acc;
      }, {});

      const limitMap = (limitsData || []).reduce((acc: Record<string, number>, row: any) => {
        acc[String(row.usuario_id)] = Number(row.limit_usd || 0);
        return acc;
      }, {});

      const defaultLimit = Number(aiDefaultLimit || 5);
      const teacherRows = (usersData || [])
        .filter((user: any) => (rolesMap[String(user.id)] || []).includes('teacher'))
        .map((user: any) => ({
          userId: String(user.id),
          name: user.nome_completo || 'Sem nome',
          email: user.email || '',
          totalUsd: usageMap[String(user.id)] || 0,
          limitUsd: limitMap[String(user.id)] || planLimitMap[String(user.id)] || defaultLimit,
        }))
        .sort((a, b) => b.totalUsd - a.totalUsd);

      setAiUsageRows(teacherRows);
      setAiLimitEdits(
        teacherRows.reduce((acc, row) => {
          acc[row.userId] = row.limitUsd.toString();
          return acc;
        }, {} as Record<string, string>)
      );
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar consumo de IA.');
    } finally {
      setAiUsageLoading(false);
    }
  };

  const handleSaveUserLimit = async (userId: string) => {
    const value = aiLimitEdits[userId];
    const limitUsd = Number(value);
    if (isNaN(limitUsd) || limitUsd <= 0) {
      toast.error('Limite invalido.');
      return;
    }
    setAiLimitSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      const { error } = await supabase
        .from('ai_usage_limits')
        .upsert({ usuario_id: userId, limit_usd: limitUsd }, { onConflict: 'usuario_id' });
      if (error) throw error;
      toast.success('Limite atualizado!');
      setAiUsageRows((prev) =>
        prev.map((row) => (row.userId === userId ? { ...row, limitUsd } : row))
      );
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar limite.');
    } finally {
      setAiLimitSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const updateSystemFlag = async (
    key: 'maintenance_mode' | 'allow_new_signups',
    value: boolean,
    setSaving: (value: boolean) => void,
    successLabel: string
  ) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes_site')
        .upsert([{ chave: key, valor: value ? '1' : '0' }], { onConflict: 'chave' });
      if (error) throw error;
      toast.success(successLabel);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar configuracao.');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = (value: boolean) => {
    setMaintenanceMode(value);
    updateSystemFlag('maintenance_mode', value, setMaintenanceSaving, 'Modo de manutencao atualizado.');
  };

  const handleSignupsToggle = (value: boolean) => {
    setAllowNewSignups(value);
    updateSystemFlag('allow_new_signups', value, setSignupsSaving, 'Cadastro de usuarios atualizado.');
  };


  const handleMarketingSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMarketingSaving(true);
    try {
      const payload = [
        { chave: 'marketing_banner_enabled', valor: marketing.bannerEnabled ? '1' : '0' },
        { chave: 'marketing_banner_image_url', valor: marketing.bannerImageUrl },
        { chave: 'marketing_banner_link_url', valor: marketing.bannerLinkUrl },
        { chave: 'marketing_banner_alt', valor: marketing.bannerAlt },
        { chave: 'marketing_pixel_head', valor: marketing.pixelHead },
        { chave: 'marketing_pixel_body', valor: marketing.pixelBody },
        { chave: 'seo_meta_title', valor: marketing.seoTitle },
        { chave: 'seo_meta_description', valor: marketing.seoDescription },
        { chave: 'seo_meta_keywords', valor: marketing.seoKeywords },
        { chave: 'seo_meta_robots', valor: marketing.seoRobots },
        { chave: 'seo_canonical_url', valor: marketing.seoCanonical },
        { chave: 'marketing_backlinks', valor: marketing.backlinks },
        { chave: 'teacher_banner_enabled', valor: marketing.teacherBannerEnabled ? '1' : '0' },
        { chave: 'teacher_banner_image_url', valor: marketing.teacherBannerImageUrl },
        { chave: 'teacher_banner_link_url', valor: marketing.teacherBannerLinkUrl },
        { chave: 'teacher_banner_alt', valor: marketing.teacherBannerAlt },
      ];
      const { error } = await supabase
        .from('configuracoes_site')
        .upsert(payload, { onConflict: 'chave' });
      if (error) throw error;
      toast.success('Marketing atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar marketing');
    } finally {
      setMarketingSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const minScoreValue = parseFloat(minScore);
    if (isNaN(minScoreValue) || minScoreValue < 0 || minScoreValue > 100) {
      toast.error('Nota mínima deve estar entre 0 e 100');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes_site')
        .upsert(
          [
            {
              chave: 'nota_minima_prova',
              valor: minScoreValue.toString(),
              descricao: 'Nota mínima para aprovação em questionários',
            },
          ],
          { onConflict: 'chave' }
        );
      if (error) throw error;
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar configurações');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))] mb-2">Configuracoes</p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))]ont-bold text-[hsl(var(--foreground))]">Parametros do sistema</h1>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Configuracoes financeiras</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Nota mínima para aprovação
            </label>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
              Defina a nota mínima (0 a 100) para liberar a prova final.
            </p>
            <div className="relative max-w-xs">
              <FaPercent className="absolute right-3 top-3 text-[hsl(var(--muted-foreground))]" />
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="input-field pr-10"
                placeholder="60"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <FaSave />
            <span>{saving ? 'Salvando...' : 'Salvar Configurações'}</span>
          </button>
        </form>
      </div>

      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
            <FaChartLine />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Creditos OpenAI</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Acompanhe o saldo e o uso da chave API da OpenAI.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            className="btn-accent flex-1 sm:flex-none"
            onClick={() => window.open('https://platform.openai.com/usage', '_blank', 'noopener')}
          >
            Abrir painel OpenAI
          </button>
          <button
            type="button"
            className="btn-outline flex-1 sm:flex-none"
            onClick={() => window.location.assign('/admin/payments')}
          >
            Abrir painel de pagamentos
          </button>
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-semibold mb-4">Consumo IA por professor</h2>
        <div className="space-y-4">
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                Limite mensal padrao (US$)
              </label>
              <input
                type="text"
                value={aiDefaultLimit}
                onChange={(event) => setAiDefaultLimit(event.target.value)}
                className="input-field"
                placeholder="Ex: 5"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
              <button
                type="button"
                className="btn-outline flex-1 sm:flex-none"
                onClick={handleSaveAiDefaultLimit}
                disabled={aiDefaultSaving}
              >
                {aiDefaultSaving ? 'Salvando...' : 'Salvar limite padrao'}
              </button>
              <button
                type="button"
                className="btn-accent flex-1 sm:flex-none"
                onClick={loadAiUsage}
                disabled={aiUsageLoading}
              >
                {aiUsageLoading ? 'Atualizando...' : 'Atualizar consumo'}
              </button>
            </div>
          </div>

          {aiUsageRows.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Clique em "Atualizar consumo" para carregar os dados.
            </p>
          ) : (
            <div className="space-y-3">
              {aiUsageRows.map((row) => (
                <div key={row.userId} className="border border-[hsl(var(--border))] rounded-[12px] p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-[hsl(var(--foreground))]">{row.name}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{row.email}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Consumo: US$ {row.totalUsd.toFixed(4)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
                        Limite mensal (US$)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiLimitEdits[row.userId] ?? row.limitUsd.toString()}
                          onChange={(event) =>
                            setAiLimitEdits((prev) => ({ ...prev, [row.userId]: event.target.value }))
                          }
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          className="btn-outline px-4"
                          onClick={() => handleSaveUserLimit(row.userId)}
                          disabled={aiLimitSaving[row.userId]}
                        >
                          {aiLimitSaving[row.userId] ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-xl font-semibold mb-4">Outras configuracoes</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 p-4 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition-colors">
            <div className="min-w-0">
              <h3 className="font-semibold text-[hsl(var(--foreground))]">Modo de Manutenção</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Desabilitar acesso temporariamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={maintenanceMode}
                onChange={(event) => handleMaintenanceToggle(event.target.checked)}
                disabled={maintenanceSaving}
              />
              <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--muted))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--accent))]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between gap-4 p-4 bg-[hsl(var(--muted))] rounded-lg hover:bg-[hsl(var(--muted))]/80 transition-colors">
            <div className="min-w-0">
              <h3 className="font-semibold text-[hsl(var(--foreground))]">Novos Cadastros</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Permitir registro de novos usuários</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={allowNewSignups}
                onChange={(event) => handleSignupsToggle(event.target.checked)}
                disabled={signupsSaving}
              />
              <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--muted))] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[hsl(var(--border))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--primary))]"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
            <FaBullhorn />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Marketing e Banner Global</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Configure o banner do topo e campanhas de visibilidade.
            </p>
          </div>
        </div>

        {marketingLoading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando marketing...</p>
        ) : (
          <form onSubmit={handleMarketingSave} className="space-y-6">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="bannerEnabled"
                checked={marketing.bannerEnabled}
                onChange={handleMarketingChange}
              />
              Ativar banner global
            </label>

            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <input
                name="bannerImageUrl"
                value={marketing.bannerImageUrl}
                onChange={handleMarketingChange}
                placeholder="URL da imagem do banner"
                className="input-field"
                required={marketing.bannerEnabled}
              />
              <input
                name="bannerLinkUrl"
                value={marketing.bannerLinkUrl}
                onChange={handleMarketingChange}
                placeholder="Link do banner (opcional)"
                className="input-field"
              />
            </div>

            <input
              name="bannerAlt"
              value={marketing.bannerAlt}
              onChange={handleMarketingChange}
              placeholder="Texto alternativo do banner"
              className="input-field"
            />

            <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))] space-y-2">
              <p className="font-semibold text-[hsl(var(--foreground))]">Especificacoes da arte</p>
              <p>Formato: PNG ou JPG.</p>
              <p>Tamanho recomendado: 1536 x 289 px (proporcao 1536:289).</p>
              <p>Tamanho minimo: 1200 x 226 px. Peso maximo: 300 KB.</p>
              <p>Evite texto nas bordas. Use fundo transparente se possivel.</p>
            </div>

            <button type="submit" className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto" disabled={marketingSaving}>
              <FaSave />
              <span>{marketingSaving ? 'Salvando...' : 'Salvar marketing'}</span>
            </button>
          </form>
        )}
      </div>

      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
            <FaBullhorn />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Banner da landing de professores</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Banner exclusivo para a pagina de captacao de professores.
            </p>
          </div>
        </div>

        <form onSubmit={handleMarketingSave} className="space-y-6">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              name="teacherBannerEnabled"
              checked={marketing.teacherBannerEnabled}
              onChange={handleMarketingChange}
            />
            Ativar banner da landing de professores
          </label>

          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <input
              name="teacherBannerImageUrl"
              value={marketing.teacherBannerImageUrl}
              onChange={handleMarketingChange}
              placeholder="URL da imagem do banner"
              className="input-field"
              required={marketing.teacherBannerEnabled}
            />
            <input
              name="teacherBannerLinkUrl"
              value={marketing.teacherBannerLinkUrl}
              onChange={handleMarketingChange}
              placeholder="Link do banner (opcional)"
              className="input-field"
            />
          </div>

          <input
            name="teacherBannerAlt"
            value={marketing.teacherBannerAlt}
            onChange={handleMarketingChange}
            placeholder="Texto alternativo do banner"
            className="input-field"
          />

          <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))] space-y-2">
            <p className="font-semibold text-[hsl(var(--foreground))]">Especificacoes da arte</p>
            <p>Formato: PNG ou JPG.</p>
            <p>Tamanho recomendado: 1536 x 289 px.</p>
            <p>Tamanho minimo: 1200 x 226 px. Peso maximo: 300 KB.</p>
            <p>Evite texto nas bordas. Use fundo transparente se possivel.</p>
          </div>

          <button type="submit" className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto" disabled={marketingSaving}>
            <FaSave />
            <span className="hidden sm:inline">{marketingSaving ? 'Salvando...' : 'Salvar banner professores'}</span>
            <span className="sm:hidden">{marketingSaving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </form>
      </div>

      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
            <FaCode />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Pixels e codigos de rastreio</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Insira scripts de conversao, analytics e remarketing.
            </p>
          </div>
        </div>

        <form onSubmit={handleMarketingSave} className="space-y-4">
          <textarea
            name="pixelHead"
            value={marketing.pixelHead}
            onChange={handleMarketingChange}
            placeholder="Codigo para inserir no <head>"
            className="input-field min-h-[140px] font-mono text-xs"
          />
          <textarea
            name="pixelBody"
            value={marketing.pixelBody}
            onChange={handleMarketingChange}
            placeholder="Codigo para inserir no <body>"
            className="input-field min-h-[140px] font-mono text-xs"
          />
          <button type="submit" className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto" disabled={marketingSaving}>
            <FaSave />
            <span>{marketingSaving ? 'Salvando...' : 'Salvar pixels'}</span>
          </button>
        </form>
      </div>

      <div className="card mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-11 w-11 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
            <FaSearch />
          </div>
          <div>
            <h2 className="text-xl font-semibold">SEO e backlinks</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Ajuste meta tags e registre backlinks estrategicos.
            </p>
          </div>
        </div>

        <form onSubmit={handleMarketingSave} className="space-y-4">
          <input
            name="seoTitle"
            value={marketing.seoTitle}
            onChange={handleMarketingChange}
            placeholder="Titulo SEO global"
            className="input-field"
          />
          <textarea
            name="seoDescription"
            value={marketing.seoDescription}
            onChange={handleMarketingChange}
            placeholder="Descricao SEO"
            className="input-field min-h-[120px]"
          />
          <input
            name="seoKeywords"
            value={marketing.seoKeywords}
            onChange={handleMarketingChange}
            placeholder="Palavras-chave (separadas por virgula)"
            className="input-field"
          />
          <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
            <input
              name="seoRobots"
              value={marketing.seoRobots}
              onChange={handleMarketingChange}
              placeholder="Robots (ex: index,follow)"
              className="input-field"
            />
            <input
              name="seoCanonical"
              value={marketing.seoCanonical}
              onChange={handleMarketingChange}
              placeholder="Canonical URL"
              className="input-field"
            />
          </div>
          <textarea
            name="backlinks"
            value={marketing.backlinks}
            onChange={handleMarketingChange}
            placeholder="Backlinks (um por linha ou anotações)"
            className="input-field min-h-[140px]"
          />
          <button type="submit" className="btn-accent flex items-center justify-center gap-2 w-full sm:w-auto" disabled={marketingSaving}>
            <FaSave />
            <span>{marketingSaving ? 'Salvando...' : 'Salvar SEO'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
