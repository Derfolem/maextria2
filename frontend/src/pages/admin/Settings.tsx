import { useEffect, useState } from 'react';
import { getValidAccessToken, supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaSave, FaPercent, FaBullhorn, FaCode, FaSearch, FaChartLine } from 'react-icons/fa';

export default function AdminSettings() {
  const [profitShare, setProfitShare] = useState('');
  const [minScore, setMinScore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [marketingLoading, setMarketingLoading] = useState(true);
  const [marketingSaving, setMarketingSaving] = useState(false);
  const [openAiUsage, setOpenAiUsage] = useState<{
    total_granted: number;
    total_used: number;
    total_available: number;
    expires_at: number | null;
  } | null>(null);
  const [openAiLoading, setOpenAiLoading] = useState(false);
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
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
        .in('chave', ['admin_profit_share', 'nota_minima_prova']);
      if (error) throw error;
      const adminShare = Number(data?.find((item: any) => item.chave === 'admin_profit_share')?.valor ?? 30);
      const notaMinima = Number(data?.find((item: any) => item.chave === 'nota_minima_prova')?.valor ?? 60);
      setProfitShare((100 - adminShare).toString());
      setMinScore(notaMinima.toString());
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

  const handleLoadOpenAiUsage = async () => {
    setOpenAiLoading(true);
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        throw new Error('Sessao expirada. Faça login novamente.');
      }
      const { data, error } = await supabase.functions.invoke('openai-usage', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(supabaseAnonKey ? { apikey: supabaseAnonKey } : {}),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOpenAiUsage(data ?? null);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar creditos da OpenAI.');
    } finally {
      setOpenAiLoading(false);
    }
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

    const value = parseFloat(profitShare);
    const minScoreValue = parseFloat(minScore);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error('Percentual deve estar entre 0 e 100');
      return;
    }
    if (isNaN(minScoreValue) || minScoreValue < 0 || minScoreValue > 100) {
      toast.error('Nota mínima deve estar entre 0 e 100');
      return;
    }

    setSaving(true);
    try {
      const adminShare = (100 - value).toString();
      const { error } = await supabase
        .from('configuracoes_site')
        .upsert(
          [
            {
              chave: 'admin_profit_share',
              valor: adminShare,
              descricao: 'Percentual da plataforma sobre vendas de certificados',
            },
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

        <div className="space-y-4">
          <button
            type="button"
            className="btn-outline"
            onClick={handleLoadOpenAiUsage}
            disabled={openAiLoading}
          >
            {openAiLoading ? 'Carregando...' : 'Atualizar creditos'}
          </button>

          {openAiUsage ? (
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
                <p className="font-semibold">Total concedido</p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  US$ {openAiUsage.total_granted.toFixed(2)}
                </p>
              </div>
              <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
                <p className="font-semibold">Total usado</p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  US$ {openAiUsage.total_used.toFixed(2)}
                </p>
              </div>
              <div className="rounded-[12px] border border-[hsl(var(--border))] p-4">
                <p className="font-semibold">Saldo disponivel</p>
                <p className="text-[hsl(var(--muted-foreground))]">
                  US$ {openAiUsage.total_available.toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Clique em "Atualizar creditos" para consultar o saldo atual.
            </p>
          )}

          <div className="rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
            Caso o valor nao apareca, verifique em platform.openai.com/usage.
          </div>
        </div>
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

            <div className="grid md:grid-cols-2 gap-4">
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

            <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={marketingSaving}>
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

          <div className="grid md:grid-cols-2 gap-4">
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

          <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={marketingSaving}>
            <FaSave />
            <span>{marketingSaving ? 'Salvando...' : 'Salvar banner professores'}</span>
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
          <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={marketingSaving}>
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
          <div className="grid md:grid-cols-2 gap-4">
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
          <button type="submit" className="btn-accent inline-flex items-center gap-2" disabled={marketingSaving}>
            <FaSave />
            <span>{marketingSaving ? 'Salvando...' : 'Salvar SEO'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
