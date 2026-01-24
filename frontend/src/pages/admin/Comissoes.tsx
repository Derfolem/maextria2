import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaDollarSign, FaCheck, FaFilter, FaUniversity } from 'react-icons/fa';

type Comissao = {
  id: string;
  professor_id: string;
  professor_nome: string;
  professor_email: string;
  curso_titulo: string;
  valor_venda: number;
  percentual_professor: number;
  valor_comissao: number;
  status: 'pendente' | 'pago' | 'cancelado';
  data_pagamento: string | null;
  criado_em: string;
};

type RelatorioProfessor = {
  professor_id: string;
  professor_nome: string;
  professor_email: string;
  total_pendentes: number;
  total_pagas: number;
  valor_pendente: number;
  valor_pago: number;
  valor_total: number;
};

type DadosBancarios = {
  titular: string;
  documento: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  chave_pix: string | null;
};

export default function AdminComissoes() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'pago'>('pendente');
  const [filterProfessor, setFilterProfessor] = useState<string>('');
  const [selectedComissoes, setSelectedComissoes] = useState<Set<string>>(new Set());
  const [markingAsPaid, setMarkingAsPaid] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankData, setBankData] = useState<DadosBancarios | null>(null);
  const [bankLoading, setBankLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterProfessor]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar comissoes com dados do professor e curso
      let query = supabase
        .from('comissoes_professores')
        .select(`
          id,
          professor_id,
          curso_id,
          valor_venda,
          percentual_professor,
          valor_comissao,
          status,
          data_pagamento,
          criado_em,
          usuarios!comissoes_professores_professor_id_fkey(nome_completo, email),
          cursos!comissoes_professores_curso_id_fkey(titulo)
        `)
        .order('criado_em', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterProfessor) {
        query = query.eq('professor_id', filterProfessor);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Comissao[] = (data || []).map((row: any) => ({
        id: row.id,
        professor_id: row.professor_id,
        professor_nome: row.usuarios?.nome_completo || 'Desconhecido',
        professor_email: row.usuarios?.email || '',
        curso_titulo: row.cursos?.titulo || 'Curso removido',
        valor_venda: row.valor_venda,
        percentual_professor: row.percentual_professor,
        valor_comissao: row.valor_comissao,
        status: row.status,
        data_pagamento: row.data_pagamento,
        criado_em: row.criado_em,
      }));

      setComissoes(mapped);

      // Carregar relatório agrupado por professor
      const { data: relatorioData, error: relatorioError } = await supabase
        .from('relatorio_comissoes_professor')
        .select('*')
        .order('valor_pendente', { ascending: false });

      if (relatorioError) {
        console.error('Erro ao carregar relatório:', relatorioError);
      } else {
        setRelatorio(relatorioData || []);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar comissões.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectComissao = (id: string) => {
    setSelectedComissoes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const pendentes = comissoes.filter((c) => c.status === 'pendente');
    if (selectedComissoes.size === pendentes.length) {
      setSelectedComissoes(new Set());
    } else {
      setSelectedComissoes(new Set(pendentes.map((c) => c.id)));
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedComissoes.size === 0) {
      toast.error('Selecione pelo menos uma comissão.');
      return;
    }

    setMarkingAsPaid(true);
    try {
      const { error } = await supabase
        .from('comissoes_professores')
        .update({
          status: 'pago',
          data_pagamento: new Date().toISOString(),
        })
        .in('id', Array.from(selectedComissoes));

      if (error) throw error;

      toast.success(`${selectedComissoes.size} comissão(ões) marcada(s) como paga(s)!`);
      setSelectedComissoes(new Set());
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao marcar como pago.');
    } finally {
      setMarkingAsPaid(false);
    }
  };

  const handleViewBankData = async (professorId: string) => {
    setBankLoading(true);
    setShowBankModal(true);
    setBankData(null);

    try {
      const { data, error } = await supabase
        .from('professor_dados_bancarios')
        .select('titular, documento, banco, agencia, conta, tipo_conta, chave_pix')
        .eq('usuario_id', professorId)
        .maybeSingle();

      if (error) throw error;

      setBankData(data);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dados bancários.');
    } finally {
      setBankLoading(false);
    }
  };

  const totalPendente = relatorio.reduce((sum, r) => sum + r.valor_pendente, 0);
  const totalPago = relatorio.reduce((sum, r) => sum + r.valor_pago, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Financeiro</p>
        <h1 className="headline-font text-4xl md:text-5xl">Comissoes dos professores</h1>
      </div>

      {/* Resumo geral */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <FaDollarSign />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total pendente</p>
              <p className="text-2xl font-bold">R$ {totalPendente.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FaCheck />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Total pago</p>
              <p className="text-2xl font-bold">R$ {totalPago.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--primary))]">
              <FaDollarSign />
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Professores com saldo</p>
              <p className="text-2xl font-bold">{relatorio.filter((r) => r.valor_pendente > 0).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Relatório por professor */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Saldo por professor</h2>
        {relatorio.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma comissão registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-3 px-2">Professor</th>
                  <th className="text-right py-3 px-2">Pendente</th>
                  <th className="text-right py-3 px-2">Pago</th>
                  <th className="text-right py-3 px-2">Total</th>
                  <th className="text-center py-3 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map((r) => (
                  <tr key={r.professor_id} className="border-b border-[hsl(var(--border))]">
                    <td className="py-3 px-2">
                      <p className="font-semibold">{r.professor_nome}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.professor_email}</p>
                    </td>
                    <td className="text-right py-3 px-2 text-yellow-600 font-semibold">
                      R$ {r.valor_pendente.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2 text-green-600">
                      R$ {r.valor_pago.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-2 font-semibold">
                      R$ {r.valor_total.toFixed(2)}
                    </td>
                    <td className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          className="text-xs text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                          onClick={() => handleViewBankData(r.professor_id)}
                        >
                          <FaUniversity />
                          Ver dados bancários
                        </button>
                        <button
                          type="button"
                          className="text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                          onClick={() => setFilterProfessor(r.professor_id)}
                        >
                          Filtrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filtros e lista de comissões */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">Lista de comissoes</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FaFilter className="text-[hsl(var(--muted-foreground))]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="input-field text-sm py-2"
              >
                <option value="all">Todas</option>
                <option value="pendente">Pendentes</option>
                <option value="pago">Pagas</option>
              </select>
            </div>
            {filterProfessor && (
              <button
                type="button"
                className="text-xs text-[hsl(var(--primary))] hover:underline"
                onClick={() => setFilterProfessor('')}
              >
                Limpar filtro de professor
              </button>
            )}
          </div>
        </div>

        {comissoes.filter((c) => c.status === 'pendente').length > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-[hsl(var(--muted))] rounded-[12px]">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedComissoes.size === comissoes.filter((c) => c.status === 'pendente').length}
                onChange={handleSelectAll}
              />
              Selecionar todas pendentes
            </label>
            <button
              type="button"
              className="btn-accent text-sm py-2"
              onClick={handleMarkAsPaid}
              disabled={markingAsPaid || selectedComissoes.size === 0}
            >
              {markingAsPaid ? 'Processando...' : `Marcar ${selectedComissoes.size} como paga(s)`}
            </button>
          </div>
        )}

        {comissoes.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma comissão encontrada.</p>
        ) : (
          <div className="space-y-3">
            {comissoes.map((c) => (
              <div
                key={c.id}
                className={`border rounded-[12px] p-4 ${
                  c.status === 'pendente'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-[hsl(var(--border))]'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {c.status === 'pendente' && (
                      <input
                        type="checkbox"
                        checked={selectedComissoes.has(c.id)}
                        onChange={() => handleSelectComissao(c.id)}
                        className="mt-1"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{c.professor_nome}</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{c.curso_titulo}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(c.criado_em).toLocaleDateString('pt-BR')} - Venda: R$ {c.valor_venda.toFixed(2)} ({c.percentual_professor}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[hsl(var(--primary))]">
                      R$ {c.valor_comissao.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs uppercase tracking-wider ${
                        c.status === 'pendente' ? 'text-yellow-600' : 'text-green-600'
                      }`}
                    >
                      {c.status}
                    </span>
                    {c.data_pagamento && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Pago em {new Date(c.data_pagamento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de dados bancários */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowBankModal(false)}
            aria-label="Fechar modal"
          />
          <div className="relative bg-[hsl(var(--background))] rounded-[20px] p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Dados bancarios do professor</h3>
            {bankLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando...</p>
            ) : !bankData ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Professor ainda nao cadastrou os dados bancarios.
              </p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Titular:</span>
                  <span className="font-semibold">{bankData.titular}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">CPF/CNPJ:</span>
                  <span className="font-semibold">{bankData.documento}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Banco:</span>
                  <span className="font-semibold">{bankData.banco}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Agencia:</span>
                  <span className="font-semibold">{bankData.agencia}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Conta:</span>
                  <span className="font-semibold">{bankData.conta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Tipo:</span>
                  <span className="font-semibold">{bankData.tipo_conta}</span>
                </div>
                {bankData.chave_pix && (
                  <div className="flex justify-between pt-2 border-t border-[hsl(var(--border))]">
                    <span className="text-[hsl(var(--muted-foreground))]">Chave PIX:</span>
                    <span className="font-semibold text-[hsl(var(--primary))]">{bankData.chave_pix}</span>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              className="btn-outline w-full mt-6"
              onClick={() => setShowBankModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
