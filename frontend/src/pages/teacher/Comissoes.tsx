import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import toast from 'react-hot-toast';
import {
  FaBolt,
  FaChartLine,
  FaClipboardList,
  FaCoins,
  FaExternalLinkAlt,
  FaLink,
  FaReceipt,
} from 'react-icons/fa';

type LedgerRow = {
  id: string;
  curso_id: string;
  created_at: string;
  total_commission: number;
  commission_amount: number;
  commission_bonus_amount: number;
  base_pct: number;
  affiliate_bonus_pct: number;
  source_type: 'ORGANIC' | 'AFFILIATE';
  status: 'OPEN' | 'PAID' | 'REVERSED';
  cursos?: { titulo?: string } | null;
  transacoes_pagamento?: { valor?: number } | null;
};

type PayoutRow = {
  id: string;
  amount: number;
  paid_at: string;
  note: string | null;
};

type CourseMetric = {
  course_id: string;
  certificates_sold: number;
  avg_rating: number;
  completion_rate: number;
};

type CourseRow = {
  id: string;
  titulo: string;
  rating_medio?: number | null;
  ativo?: boolean | null;
};

type InstructorMetrics = {
  certificates_sold: number;
  avg_rating: number;
  completion_rate: number;
  active_courses: number;
};

type Tier = {
  tier_key: string;
  label: string;
  base_pct: number;
  min_certificates: number;
  max_certificates?: number | null;
  min_rating?: number | null;
  min_completion_rate?: number | null;
  min_courses_active?: number | null;
  priority: number;
  rule_id?: string;
};

type Rule = { id: string; version: number; name: string };

type AffiliateLink = { id: string; code: string };

const tabs = [
  { key: 'resumo', label: 'Resumo', icon: <FaChartLine /> },
  { key: 'cursos', label: 'Cursos', icon: <FaClipboardList /> },
  { key: 'extrato', label: 'Extrato', icon: <FaReceipt /> },
  { key: 'afiliados', label: 'Afiliados', icon: <FaLink /> },
  { key: 'pagamentos', label: 'Pagamentos', icon: <FaCoins /> },
] as const;

type TabKey = typeof tabs[number]['key'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : '-';

const computeTier = (tiers: Tier[], metrics?: InstructorMetrics | null) => {
  if (!tiers.length || !metrics) return null;
  const sorted = [...tiers].sort((a, b) => b.priority - a.priority);
  return (
    sorted.find((tier) => {
      if (metrics.certificates_sold < tier.min_certificates) return false;
      if (tier.max_certificates && metrics.certificates_sold > tier.max_certificates) return false;
      if (tier.min_rating && metrics.avg_rating < tier.min_rating) return false;
      if (tier.min_completion_rate && metrics.completion_rate < tier.min_completion_rate) return false;
      if (tier.min_courses_active && metrics.active_courses < tier.min_courses_active) return false;
      return true;
    }) || sorted[sorted.length - 1]
  );
};

const getNextTier = (tiers: Tier[], current?: Tier | null) => {
  if (!tiers.length || !current) return null;
  const sorted = [...tiers].sort((a, b) => a.priority - b.priority);
  const currentIndex = sorted.findIndex((tier) => tier.tier_key === current.tier_key);
  return currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
};

const getBaseTier = (tiers: Tier[]) => {
  if (!tiers.length) return null;
  const sorted = [...tiers].sort((a, b) => a.priority - b.priority);
  return sorted[0];
};

const generateAffiliateCode = () => {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 10);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.slice(0, 10);
};

export default function TeacherComissoes() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabKey>('resumo');
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [courseMetrics, setCourseMetrics] = useState<Record<string, CourseMetric>>({});
  const [metrics, setMetrics] = useState<InstructorMetrics | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [affiliateLink, setAffiliateLink] = useState<AffiliateLink | null>(null);
  const [affiliateClicks, setAffiliateClicks] = useState(0);

  const [filterCourse, setFilterCourse] = useState('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [ledgerRes, payoutRes, courseRes, metricRes, ruleRes] = await Promise.all([
        supabase
          .from('commission_ledger')
          .select(
            `id, curso_id, created_at, total_commission, commission_amount, commission_bonus_amount, base_pct, affiliate_bonus_pct, source_type, status, cursos(titulo), transacoes_pagamento(valor)`
          )
          .eq('professor_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('manual_payouts')
          .select('id, amount, paid_at, note')
          .eq('professor_id', user.id)
          .order('paid_at', { ascending: false }),
        supabase
          .from('cursos')
          .select('id, titulo, rating_medio, ativo')
          .eq('professor_id', user.id)
          .order('criado_em', { ascending: false }),
        supabase
          .from('course_metrics')
          .select('course_id, certificates_sold, avg_rating, completion_rate')
          .eq('professor_id', user.id),
        supabase.from('commission_rules').select('id, version, name').eq('is_active', true).maybeSingle(),
      ]);

      if (ledgerRes.error) throw ledgerRes.error;
      if (payoutRes.error) throw payoutRes.error;
      if (courseRes.error) throw courseRes.error;
      if (metricRes.error) throw metricRes.error;

      setLedger((ledgerRes.data as LedgerRow[]) || []);
      setPayouts((payoutRes.data as PayoutRow[]) || []);
      setCourses((courseRes.data as CourseRow[]) || []);

      const metricMap: Record<string, CourseMetric> = {};
      (metricRes.data as CourseMetric[] | null)?.forEach((row) => {
        metricMap[row.course_id] = row;
      });
      setCourseMetrics(metricMap);

      if (ruleRes.data) {
        const activeRule = ruleRes.data as Rule;
        const { data: tierData, error: tierError } = await supabase
          .from('commission_tiers')
          .select('tier_key,label,base_pct,min_certificates,max_certificates,min_rating,min_completion_rate,min_courses_active,priority,rule_id')
          .eq('rule_id', activeRule.id);
        if (tierError) throw tierError;
        setTiers((tierData as Tier[]) || []);
      }

      const { data: instructorMetrics } = await supabase
        .from('instructor_metrics')
        .select('certificates_sold, avg_rating, completion_rate, active_courses')
        .eq('professor_id', user.id)
        .maybeSingle();
      setMetrics((instructorMetrics as InstructorMetrics) || null);

      let linkData: AffiliateLink | null = null;
      const { data: existingLink, error: existingError } = await supabase
        .from('affiliate_links')
        .select('id, code')
        .eq('professor_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingLink?.id) {
        linkData = existingLink as AffiliateLink;
      } else {
        const code = generateAffiliateCode();
        const { data: newLink, error: insertError } = await supabase
          .from('affiliate_links')
          .insert({ professor_id: user.id, code, is_active: true })
          .select('id, code')
          .single();
        if (insertError) throw insertError;
        linkData = newLink as AffiliateLink;
      }

      setAffiliateLink(linkData);

      if (linkData?.id) {
        const { count } = await supabase
          .from('affiliate_referrals')
          .select('id', { count: 'exact', head: true })
          .eq('affiliate_link_id', linkData.id);
        setAffiliateClicks(count || 0);
      } else {
        setAffiliateClicks(0);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar comissões.');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const total = ledger.reduce((sum, row) => sum + (row.total_commission || 0), 0);
    const open = ledger
      .filter((row) => row.status === 'OPEN')
      .reduce((sum, row) => sum + (row.total_commission || 0), 0);
    const paid = ledger
      .filter((row) => row.status === 'PAID')
      .reduce((sum, row) => sum + (row.total_commission || 0), 0);
    return { total, open, paid };
  }, [ledger]);

  const currentTier = useMemo(() => computeTier(tiers, metrics), [tiers, metrics]);
  const baseTier = useMemo(() => getBaseTier(tiers), [tiers]);
  const nextTier = useMemo(() => getNextTier(tiers, currentTier ?? baseTier), [tiers, currentTier, baseTier]);
  const effectiveTier = currentTier ?? baseTier;
  const effectivePct = useMemo(() => {
    if (effectiveTier?.base_pct != null) return effectiveTier.base_pct;
    const lastLedger = ledger[0];
    return lastLedger?.base_pct ?? 0;
  }, [effectiveTier, ledger]);

  const affiliateTotals = useMemo(() => {
    const affiliateSales = ledger.filter((row) => row.source_type === 'AFFILIATE');
    return {
      sales: affiliateSales.length,
      bonus: affiliateSales.reduce((sum, row) => sum + (row.commission_bonus_amount || 0), 0),
    };
  }, [ledger]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((row) => {
      if (filterCourse !== 'all' && row.curso_id !== filterCourse) return false;
      if (filterStart && new Date(row.created_at) < new Date(filterStart)) return false;
      if (filterEnd && new Date(row.created_at) > new Date(filterEnd)) return false;
      return true;
    });
  }, [ledger, filterCourse, filterStart, filterEnd]);

  const affiliateUrl = useMemo(() => {
    if (!affiliateLink?.code) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.maextria.com.br';
    return `${origin}/courses?ref=${affiliateLink.code}`;
  }, [affiliateLink]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Comissoes</p>
        <h1 className="headline-font text-4xl md:text-5xl">Painel de ganhos</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[14px] border text-sm transition ${
              activeTab === tab.key
                ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))] shadow-lg'
                : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'resumo' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total a receber</p>
              <p className="text-3xl font-bold text-[hsl(var(--primary))]">{formatCurrency(totals.open)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total pago</p>
              <p className="text-3xl font-bold">{formatCurrency(totals.paid)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total historico</p>
              <p className="text-3xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-4 text-[hsl(var(--primary))]">
                <FaBolt />
                <h2 className="text-lg font-semibold">Nivel atual</h2>
              </div>
              <p className="text-2xl font-bold">
                {currentTier?.label || (baseTier ? `${baseTier.label} (base)` : 'Sem dados suficientes')}
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                {effectiveTier ? `${effectiveTier.base_pct}% de comissao base` : 'Aguardando metricas do professor.'}
              </p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 mb-4 text-[hsl(var(--primary))]">
                <FaChartLine />
                <h2 className="text-lg font-semibold">Progresso para o proximo nivel</h2>
              </div>
              {nextTier && metrics ? (
                <div className="space-y-2">
                  <p className="font-semibold">{nextTier.label}</p>
                  <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--primary))]"
                      style={{
                        width: `${Math.min(
                          100,
                          (metrics.certificates_sold / Math.max(nextTier.min_certificates, 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {metrics.certificates_sold} / {nextTier.min_certificates} certificados
                  </p>
                  {nextTier.min_rating && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Rating minimo: {nextTier.min_rating}</p>
                  )}
                  {nextTier.min_completion_rate && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Conclusao minima: {nextTier.min_completion_rate}%
                    </p>
                  )}
                  {nextTier.min_courses_active && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Cursos ativos: {nextTier.min_courses_active}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Voce ja esta no nivel maximo ou sem metricas suficientes.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cursos' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Cursos e metricas</h2>
          {courses.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum curso encontrado.</p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const metric = courseMetrics[course.id];
                return (
                  <div key={course.id} className="border border-[hsl(var(--border))] rounded-[14px] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{course.titulo}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          Certificados: {metric?.certificates_sold ?? 0} | Rating medio:{' '}
                          {(metric?.avg_rating ?? course.rating_medio ?? 0).toFixed(1)} | Conclusao:{' '}
                          {(metric?.completion_rate ?? 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Comissao aplicada</p>
                        <p className="text-lg font-semibold">{effectivePct}%</p>
                      </div>
                    </div>
                    {nextTier && (
                      <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">
                        Meta para subir: {nextTier.label} (min {nextTier.min_certificates} certificados
                        {nextTier.min_rating ? `, rating ${nextTier.min_rating}` : ''}
                        {nextTier.min_completion_rate ? `, conclusao ${nextTier.min_completion_rate}%` : ''})
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'extrato' && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold">Extrato de vendas</h2>
            <div className="flex flex-wrap gap-3">
              <select
                className="input-field text-sm"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="all">Todos os cursos</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.titulo}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input-field text-sm"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
              />
              <input
                type="date"
                className="input-field text-sm"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
              />
            </div>
          </div>
          {filteredLedger.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma venda encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left py-3 px-2">Data</th>
                    <th className="text-left py-3 px-2">Curso</th>
                    <th className="text-right py-3 px-2">Valor</th>
                    <th className="text-right py-3 px-2">%</th>
                    <th className="text-right py-3 px-2">Comissao</th>
                    <th className="text-center py-3 px-2">Tipo</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map((row) => (
                    <tr key={row.id} className="border-b border-[hsl(var(--border))]">
                      <td className="py-3 px-2">{formatDate(row.created_at)}</td>
                      <td className="py-3 px-2">{row.cursos?.titulo || 'Curso'}</td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(row.transacoes_pagamento?.valor ?? 0)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {row.base_pct + row.affiliate_bonus_pct}%
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(row.total_commission)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {row.source_type === 'AFFILIATE' ? 'Afiliado' : 'Organico'}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {row.status === 'OPEN' && 'Em aberto'}
                        {row.status === 'PAID' && 'Pago'}
                        {row.status === 'REVERSED' && 'Estornado'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'afiliados' && (
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6 items-start">
          <div className="card">
            <div className="flex items-center gap-2 text-[hsl(var(--primary))] mb-4">
              <FaLink />
              <h2 className="text-lg font-semibold">Link do professor</h2>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Use este link para divulgar seus cursos e ganhar +10% nas vendas via afiliado.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                className="input-field flex-1 min-w-[220px]"
                value={affiliateUrl}
                readOnly
              />
              <button
                type="button"
                className="btn-outline text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(affiliateUrl);
                  toast.success('Link copiado!');
                }}
              >
                Copiar
              </button>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[hsl(var(--primary))] flex items-center gap-2"
              >
                Abrir <FaExternalLinkAlt />
              </a>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="border border-[hsl(var(--border))] rounded-[12px] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Cliques</p>
                <p className="text-lg font-semibold">{affiliateClicks}</p>
              </div>
              <div className="border border-[hsl(var(--border))] rounded-[12px] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Vendas via link</p>
                <p className="text-lg font-semibold">{affiliateTotals.sales}</p>
              </div>
              <div className="border border-[hsl(var(--border))] rounded-[12px] p-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Comissao extra</p>
                <p className="text-lg font-semibold">{formatCurrency(affiliateTotals.bonus)}</p>
              </div>
            </div>
            <div className="mt-6 rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-4">
              <p className="text-sm font-semibold mb-2">Como gerar o link</p>
              <ol className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                <li>1) Clique em \"Copiar\" e compartilhe o link com seus alunos.</li>
                <li>2) O link ja inclui seu codigo (`?ref=...`).</li>
                <li>3) Compras confirmadas via link somam +10% na sua comissao.</li>
              </ol>
            </div>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Regras antifraude</h2>
            <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
              <li>Vendas via link valido do professor (+10%).</li>
              <li>Cliques repetidos podem ser auditados manualmente.</li>
              <li>Estornos removem o bonus automaticamente.</li>
              <li>Links sao pessoais e intransferiveis.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'pagamentos' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Pagamentos registrados</h2>
          {payouts.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum pagamento registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left py-3 px-2">Data</th>
                    <th className="text-right py-3 px-2">Valor</th>
                    <th className="text-left py-3 px-2">Observacao</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((row) => (
                    <tr key={row.id} className="border-b border-[hsl(var(--border))]">
                      <td className="py-3 px-2">{formatDate(row.paid_at)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(row.amount)}</td>
                      <td className="py-3 px-2">{row.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
