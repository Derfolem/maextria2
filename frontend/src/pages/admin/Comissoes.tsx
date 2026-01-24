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
  dados_bancarios?: DadosBancarios | null;
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
        setRelatorio([]);
      } else {
        // Carregar dados bancários de todos os professores
        const professorIds = (relatorioData || []).map((r: any) => r.professor_id);
        let dadosBancariosMap: Record<string, DadosBancarios> = {};

        if (professorIds.length > 0) {
          const { data: bankDataList } = await supabase
            .from('professor_dados_bancarios')
            .select('usuario_id, titular, documento, banco, agencia, conta, tipo_conta, chave_pix')
            .in('usuario_id', professorIds);

          if (bankDataList) {
            dadosBancariosMap = bankDataList.reduce((acc: Record<string, DadosBancarios>, item: any) => {
              acc[item.usuario_id] = {
                titular: item.titular,
                documento: item.documento,
                banco: item.banco,
                agencia: item.agencia,
                conta: item.conta,
                tipo_conta: item.tipo_conta,
                chave_pix: item.chave_pix,
              };
              return acc;
            }, {});
          }
        }

        // Juntar dados bancários com o relatório
        const relatorioComBanco = (relatorioData || []).map((r: any) => ({
          ...r,
          dados_bancarios: dadosBancariosMap[r.professor_id] || null,
        }));

        setRelatorio(relatorioComBanco);
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
                  <tr key={r.professor_id} className="border-b border-[hsl(var(--border))] align-top">
                    <td className="py-3 px-2">
                      <p className="font-semibold">{r.professor_nome}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{r.professor_email}</p>
                      {r.dados_bancarios ? (
                        <div className="mt-2 p-2 bg-[hsl(var(--muted))] rounded-lg text-xs space-y-1">
                          <div className="flex items-center gap-1 text-[hsl(var(--primary))] font-medium">
                            <FaUniversity />
                            Dados para repasse:
                          </div>
                          {r.dados_bancarios.chave_pix && (
                            <p><span className="text-[hsl(var(--muted-foreground))]">PIX:</span> <strong>{r.dados_bancarios.chave_pix}</strong></p>
                          )}
                          <p><span className="text-[hsl(var(--muted-foreground))]">Titular:</span> {r.dados_bancarios.titular}</p>
                          <p><span className="text-[hsl(var(--muted-foreground))]">CPF/CNPJ:</span> {r.dados_bancarios.documento}</p>
                          <p><span className="text-[hsl(var(--muted-foreground))]">Banco:</span> {r.dados_bancarios.banco} | Ag: {r.dados_bancarios.agencia} | Conta: {r.dados_bancarios.conta} ({r.dados_bancarios.tipo_conta})</p>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-yellow-600">Dados bancários não cadastrados</p>
                      )}
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
                      <button
                        type="button"
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:underline"
                        onClick={() => setFilterProfessor(r.professor_id)}
                      >
                        Filtrar comissões
                      </button>
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

      </div>
  );
}
