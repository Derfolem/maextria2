import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
  FaBalanceScale,
  FaBook,
  FaCheckCircle,
  FaClipboardList,
  FaCrown,
  FaDollarSign,
  FaLink,
  FaReceipt,
  FaUserTie,
} from 'react-icons/fa';

type LedgerRow = {
  id: string;
  professor_id: string;
  curso_id: string;
  created_at: string;
  total_commission: number;
  commission_bonus_amount: number;
  base_pct: number;
  affiliate_bonus_pct: number;
  source_type: 'ORGANIC' | 'AFFILIATE';
  status: 'OPEN' | 'PAID' | 'REVERSED';
  cursos?: { titulo?: string; professor_nome?: string } | null;
  transacoes_pagamento?: { valor?: number } | null;
};


type Rule = { id: string; version: number; name: string; is_active: boolean; starts_at: string };

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
};

type AffiliateLink = { id: string; professor_id: string; code: string; is_active: boolean; created_at: string };

type ProfessorSummary = {
  professor_id: string;
  name: string;
  total_open: number;
  total_paid: number;
  total_all: number;
};

const tabs = [
  { key: 'visao', label: 'Visao geral', icon: <FaBalanceScale /> },
  { key: 'professores', label: 'Professores', icon: <FaUserTie /> },
  { key: 'detalhe', label: 'Detalhe do professor', icon: <FaClipboardList /> },
  { key: 'regras', label: 'Regras', icon: <FaCrown /> },
  { key: 'afiliados', label: 'Afiliados / Auditoria', icon: <FaLink /> },
] as const;

type TabKey = typeof tabs[number]['key'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : '-';

const computeTier = (tiers: Tier[], metrics: {
  certificates: number;
  rating: number;
  completion: number;
  courses: number;
}) => {
  const sorted = [...tiers].sort((a, b) => b.priority - a.priority);
  return (
    sorted.find((tier) => {
      if (metrics.certificates < tier.min_certificates) return false;
      if (tier.max_certificates && metrics.certificates > tier.max_certificates) return false;
      if (tier.min_rating && metrics.rating < tier.min_rating) return false;
      if (tier.min_completion_rate && metrics.completion < tier.min_completion_rate) return false;
      if (tier.min_courses_active && metrics.courses < tier.min_courses_active) return false;
      return true;
    }) || sorted[sorted.length - 1]
  );
};

export default function AdminComissoes() {
  const [activeTab, setActiveTab] = useState<TabKey>('visao');
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<Set<string>>(new Set());
  const [payoutNote, setPayoutNote] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  const [simCertificates, setSimCertificates] = useState(0);
  const [simRating, setSimRating] = useState(4.3);
  const [simCompletion, setSimCompletion] = useState(60);
  const [simCourses, setSimCourses] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerRes, rulesRes, tiersRes, linkRes] = await Promise.all([
        supabase
          .from('commission_ledger')
          .select(
            `id, professor_id, curso_id, created_at, total_commission, commission_bonus_amount, base_pct, affiliate_bonus_pct, source_type, status, cursos(titulo, professor_nome), transacoes_pagamento(valor)`
          )
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('commission_rules').select('id, version, name, is_active, starts_at').order('version', {
          ascending: false,
        }),
        supabase
          .from('commission_tiers')
          .select('tier_key,label,base_pct,min_certificates,max_certificates,min_rating,min_completion_rate,min_courses_active,priority,rule_id'),
        supabase.from('affiliate_links').select('id, professor_id, code, is_active, created_at').order('created_at', {
          ascending: false,
        }),
      ]);

      if (ledgerRes.error) throw ledgerRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (tiersRes.error) throw tiersRes.error;
      if (linkRes.error) throw linkRes.error;

      setLedger((ledgerRes.data as LedgerRow[]) || []);
      setRules((rulesRes.data as Rule[]) || []);
      setTiers((tiersRes.data as Tier[]) || []);
      setAffiliateLinks((linkRes.data as AffiliateLink[]) || []);

      if (!selectedProfessor && (ledgerRes.data as LedgerRow[])?.length) {
        setSelectedProfessor((ledgerRes.data as LedgerRow[])[0].professor_id);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLedger = useMemo(() => {
    return ledger.filter((row) => {
      if (dateStart && new Date(row.created_at) < new Date(dateStart)) return false;
      if (dateEnd && new Date(row.created_at) > new Date(dateEnd)) return false;
      return true;
    });
  }, [ledger, dateStart, dateEnd]);

  const totals = useMemo(() => {
    const due = filteredLedger
      .filter((row) => row.status === 'OPEN')
      .reduce((sum, row) => sum + (row.total_commission || 0), 0);
    const paid = filteredLedger
      .filter((row) => row.status === 'PAID')
      .reduce((sum, row) => sum + (row.total_commission || 0), 0);
    const total = filteredLedger.reduce((sum, row) => sum + (row.total_commission || 0), 0);
    return { due, paid, total };
  }, [filteredLedger]);

  const professorSummaries = useMemo(() => {
    const map = new Map<string, ProfessorSummary>();
    ledger.forEach((row) => {
      const current = map.get(row.professor_id) || {
        professor_id: row.professor_id,
        name: row.cursos?.professor_nome || row.professor_id.slice(0, 8),
        total_open: 0,
        total_paid: 0,
        total_all: 0,
      };
      current.total_all += row.total_commission || 0;
      if (row.status === 'OPEN') current.total_open += row.total_commission || 0;
      if (row.status === 'PAID') current.total_paid += row.total_commission || 0;
      if (row.cursos?.professor_nome) current.name = row.cursos.professor_nome;
      map.set(row.professor_id, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total_open - a.total_open);
  }, [ledger]);

  const selectedLedger = useMemo(() => {
    return ledger.filter((row) => row.professor_id === selectedProfessor);
  }, [ledger, selectedProfessor]);

  const activeRule = rules.find((rule) => rule.is_active) || rules[0];
  const activeTiers = tiers.filter((tier) => (activeRule ? (tier as any).rule_id === activeRule.id : true));

  const simulatedTier = useMemo(() => {
    if (!activeTiers.length) return null;
    return computeTier(activeTiers, {
      certificates: simCertificates,
      rating: simRating,
      completion: simCompletion,
      courses: simCourses,
    });
  }, [activeTiers, simCertificates, simRating, simCompletion, simCourses]);

  const affiliateSummary = useMemo(() => {
    const affiliateSales = ledger.filter((row) => row.source_type === 'AFFILIATE');
    return {
      sales: affiliateSales.length,
      bonus: affiliateSales.reduce((sum, row) => sum + (row.commission_bonus_amount || 0), 0),
    };
  }, [ledger]);

  const handleToggleLedger = (id: string) => {
    setSelectedLedgerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRegisterPayout = async () => {
    if (!selectedProfessor || selectedLedgerIds.size === 0) {
      toast.error('Selecione comissoes para pagar.');
      return;
    }

    try {
      const { error } = await supabase.rpc('commission_create_manual_payout', {
        p_professor_id: selectedProfessor,
        p_ledger_ids: Array.from(selectedLedgerIds),
        p_paid_at: new Date().toISOString(),
        p_note: payoutNote || null,
      });
      if (error) throw error;

      toast.success('Pagamento registrado com sucesso.');
      setSelectedLedgerIds(new Set());
      setPayoutNote('');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao registrar pagamento.');
    }
  };

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
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Comissoes</p>
        <h1 className="headline-font text-4xl md:text-5xl">Gestao do comissionamento</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
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

      {activeTab === 'visao' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total devido</p>
              <p className="text-2xl font-bold text-[hsl(var(--primary))]">{formatCurrency(totals.due)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total pago</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.paid)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total comissoes</p>
              <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Bonus afiliados</p>
              <p className="text-2xl font-bold">{formatCurrency(affiliateSummary.bonus)}</p>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <div className="flex flex-wrap gap-3">
                <input type="date" className="input-field" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                <input type="date" className="input-field" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
              </div>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Aplicado ao resumo e ao extrato. Valores comissao sao calculados no momento da venda.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'professores' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Professores</h2>
          {professorSummaries.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Sem comissoes registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left py-3 px-2">Professor</th>
                    <th className="text-right py-3 px-2">A pagar</th>
                    <th className="text-right py-3 px-2">Pago</th>
                    <th className="text-right py-3 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {professorSummaries.map((prof) => (
                    <tr key={prof.professor_id} className="border-b border-[hsl(var(--border))]">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-[hsl(var(--primary))]" />
                          <span className="font-semibold">{prof.name}</span>
                        </div>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{prof.professor_id}</p>
                      </td>
                      <td className="py-3 px-2 text-right">{formatCurrency(prof.total_open)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(prof.total_paid)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(prof.total_all)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'detalhe' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Detalhe do professor</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Selecione um professor para ver extrato e registrar pagamento manual.
                </p>
              </div>
              <select
                className="input-field"
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
              >
                <option value="">Selecione</option>
                {professorSummaries.map((prof) => (
                  <option key={prof.professor_id} value={prof.professor_id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Extrato</h3>
              <div className="flex items-center gap-3">
                <input
                  className="input-field"
                  placeholder="Observacao do pagamento"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                />
                <button type="button" className="btn-accent" onClick={handleRegisterPayout}>
                  Registrar pagamento
                </button>
              </div>
            </div>

            {selectedLedger.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma comissao encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      <th className="text-left py-3 px-2">Selecionar</th>
                      <th className="text-left py-3 px-2">Data</th>
                      <th className="text-left py-3 px-2">Curso</th>
                      <th className="text-right py-3 px-2">Comissao</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLedger.map((row) => (
                      <tr key={row.id} className="border-b border-[hsl(var(--border))]">
                        <td className="py-3 px-2">
                          {row.status === 'OPEN' ? (
                            <input
                              type="checkbox"
                              checked={selectedLedgerIds.has(row.id)}
                              onChange={() => handleToggleLedger(row.id)}
                            />
                          ) : (
                            <FaCheckCircle className="text-green-600" />
                          )}
                        </td>
                        <td className="py-3 px-2">{formatDate(row.created_at)}</td>
                        <td className="py-3 px-2">{row.cursos?.titulo || 'Curso'}</td>
                        <td className="py-3 px-2 text-right">{formatCurrency(row.total_commission)}</td>
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
        </div>
      )}

      {activeTab === 'regras' && (
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Regras atuais</h2>
            {activeRule ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Versao ativa</p>
                  <p className="text-xl font-bold">v{activeRule.version} - {activeRule.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Inicio: {formatDate(activeRule.starts_at)}</p>
                </div>
                <div className="space-y-3">
                  {activeTiers.map((tier) => (
                    <div key={tier.tier_key} className="border border-[hsl(var(--border))] rounded-[12px] p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{tier.label}</p>
                        <span className="text-sm font-semibold">{tier.base_pct}%</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Min: {tier.min_certificates}
                        {tier.max_certificates ? ` | Max: ${tier.max_certificates}` : ''}
                        {tier.min_rating ? ` | Rating >= ${tier.min_rating}` : ''}
                        {tier.min_completion_rate ? ` | Conclusao >= ${tier.min_completion_rate}%` : ''}
                        {tier.min_courses_active ? ` | Cursos ativos >= ${tier.min_courses_active}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Alteracoes nao sao retroativas. Cada venda armazena o snapshot da regra vigente.
                </p>
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma regra ativa encontrada.</p>
            )}
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Simulador rapido</h2>
            <div className="space-y-3">
              <label className="text-sm">Certificados vendidos</label>
              <input
                type="number"
                className="input-field"
                value={simCertificates}
                onChange={(e) => setSimCertificates(Number(e.target.value))}
              />
              <label className="text-sm">Rating medio</label>
              <input
                type="number"
                className="input-field"
                step="0.1"
                value={simRating}
                onChange={(e) => setSimRating(Number(e.target.value))}
              />
              <label className="text-sm">Conclusao (%)</label>
              <input
                type="number"
                className="input-field"
                value={simCompletion}
                onChange={(e) => setSimCompletion(Number(e.target.value))}
              />
              <label className="text-sm">Cursos ativos</label>
              <input
                type="number"
                className="input-field"
                value={simCourses}
                onChange={(e) => setSimCourses(Number(e.target.value))}
              />
            </div>
            <div className="mt-4 p-3 rounded-[12px] bg-[hsl(var(--muted))]">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nivel estimado</p>
              <p className="text-lg font-semibold">{simulatedTier?.label || 'Sem regra ativa'}</p>
              {simulatedTier && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{simulatedTier.base_pct}% de comissao base</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'afiliados' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Links ativos</p>
              <p className="text-2xl font-bold">{affiliateLinks.filter((link) => link.is_active).length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Vendas afiliadas</p>
              <p className="text-2xl font-bold">{affiliateSummary.sales}</p>
            </div>
            <div className="card">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Bonus total</p>
              <p className="text-2xl font-bold">{formatCurrency(affiliateSummary.bonus)}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Links registrados</h2>
            {affiliateLinks.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum link registrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))]">
                      <th className="text-left py-3 px-2">Professor</th>
                      <th className="text-left py-3 px-2">Codigo</th>
                      <th className="text-left py-3 px-2">Criado em</th>
                      <th className="text-center py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateLinks.map((link) => (
                      <tr key={link.id} className="border-b border-[hsl(var(--border))]">
                        <td className="py-3 px-2">{link.professor_id}</td>
                        <td className="py-3 px-2">{link.code}</td>
                        <td className="py-3 px-2">{formatDate(link.created_at)}</td>
                        <td className="py-3 px-2 text-center">
                          {link.is_active ? 'Ativo' : 'Inativo'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <FaReceipt className="text-[hsl(var(--primary))]" />
              <h2 className="text-lg font-semibold">Auditoria</h2>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Auditoria manual disponivel: revise vendas afiliadas no extrato e invalide estornos conforme necessario.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 text-xs rounded-full px-3 py-1 bg-yellow-100 text-yellow-700">
                <FaBook />
                Sem alertas automaticos no MVP
              </span>
              <span className="inline-flex items-center gap-2 text-xs rounded-full px-3 py-1 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                <FaDollarSign />
                Estornos geram ledger reverso
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
