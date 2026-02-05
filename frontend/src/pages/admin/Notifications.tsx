import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { FaTrash, FaDownload, FaClock, FaCheckSquare, FaSquare, FaTimes } from 'react-icons/fa';

type AdminNotification = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  criado_em: string;
  metadata?: Record<string, any>;
};

const typeLabels: Record<string, string> = {
  user_registered: 'Cadastro',
  enrollment: 'Matricula',
  course_created: 'Curso criado',
  certificate_purchased: 'Certificado comprado',
  certificate_issued: 'Certificado emitido',
  course_suggestion: 'Sugestao de curso',
  moderacao_conteudo: 'Moderacao de conteudo',
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id, tipo, titulo, descricao, criado_em, metadata')
      .gte('criado_em', since.toISOString())
      .order('criado_em', { ascending: false })
      .limit(200);

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const relativeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' }),
    []
  );

  const formatTimeAgo = (value: string) => {
    const date = new Date(value);
    const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (Number.isNaN(diffSeconds)) return 'agora';

    const minutes = Math.floor(diffSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (Math.abs(days) >= 1) return relativeFormatter.format(-days, 'day');
    if (Math.abs(hours) >= 1) return relativeFormatter.format(-hours, 'hour');
    if (Math.abs(minutes) >= 1) return relativeFormatter.format(-minutes, 'minute');
    return relativeFormatter.format(-diffSeconds, 'second');
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.tipo === filter;
  });

  // --- Seleção ---
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.has(n.id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredNotifications.forEach((n) => next.delete(n.id));
      } else {
        filteredNotifications.forEach((n) => next.add(n.id));
      }
      return next;
    });
  };

  // --- Ações ---
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!confirm(`Excluir ${count} notificação(ões) definitivamente do banco de dados?`)) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .in('id', ids);
      if (error) throw error;
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelectedIds(new Set());
      toast.success(`${count} notificação(ões) excluída(s).`);
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir notificações.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCleanupOld = async () => {
    if (!confirm('Remover todas as notificações com mais de 30 dias do banco de dados?')) return;
    setDeleting(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .lt('criado_em', since.toISOString());
      if (error) throw error;
      toast.success('Notificações antigas removidas.');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao limpar notificações.');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const toExport =
      selectedIds.size > 0
        ? notifications.filter((n) => selectedIds.has(n.id))
        : filteredNotifications;

    if (toExport.length === 0) {
      toast.error('Nenhuma notificação para exportar.');
      return;
    }

    const esc = (s: string) => `"${s.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    const headers = ['ID', 'Tipo', 'Título', 'Descrição', 'Criado em', 'Metadata'];
    const rows = toExport.map((n) =>
      [
        n.id,
        n.tipo,
        esc(n.titulo),
        esc(n.descricao),
        n.criado_em,
        esc(JSON.stringify(n.metadata || {})),
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Administracao</p>
          <h1 className="headline-font text-4xl md:text-5xl">Notificacoes</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Ultimos 30 dias de atividade da plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-[hsl(var(--member-strong))]" htmlFor="filter">
            Filtrar
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="input-field max-w-[220px] text-[hsl(var(--member-strong))]"
          >
            <option value="all">Todos</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {!selectMode ? (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="btn-outline flex items-center gap-2 text-sm"
          >
            <FaSquare className="text-xs" /> Selecionar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              <FaTimes className="text-xs" /> Cancelar
            </button>
            <button
              type="button"
              onClick={toggleAll}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              {allFilteredSelected ? <FaCheckSquare className="text-xs" /> : <FaSquare className="text-xs" />}
              Todas
            </button>
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
              className="btn-outline flex items-center gap-2 text-sm border-red-400 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-red-500"
            >
              <FaTrash className="text-xs" /> Excluir ({selectedIds.size})
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleExportCSV}
          className="btn-outline flex items-center gap-2 text-sm"
        >
          <FaDownload className="text-xs" /> Exportar CSV
        </button>
        <button
          type="button"
          onClick={handleCleanupOld}
          disabled={deleting}
          className="btn-outline flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaClock className="text-xs" /> Limpar +30 dias
        </button>
      </div>

      {/* Lista */}
      <div className="card">
        {loading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando notificacoes...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma notificacao encontrada.</p>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col gap-2 p-3 border border-[hsl(var(--border))] rounded-[12px] md:flex-row md:items-start md:gap-3 ${
                  selectMode && selectedIds.has(item.id) ? 'ring-2 ring-[hsl(var(--primary))]' : ''
                }`}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    className="accent-[hsl(var(--primary))] w-4 h-4 shrink-0 mt-0.5"
                  />
                )}

                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      {typeLabels[item.tipo] || item.tipo}
                    </span>
                  </div>
                  <p className="font-semibold">{item.titulo}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.descricao}</p>

                  {item.tipo === 'course_suggestion' && item.metadata && (
                    <div className="mt-2 text-sm text-[hsl(var(--member-strong))] space-y-1">
                      {item.metadata.student_name && (
                        <p><strong>Aluno:</strong> {item.metadata.student_name}</p>
                      )}
                      {item.metadata.course_title && (
                        <p><strong>Curso sugerido:</strong> {item.metadata.course_title}</p>
                      )}
                      {item.metadata.area && (
                        <p><strong>Área:</strong> {item.metadata.area}</p>
                      )}
                      {item.metadata.specialization && (
                        <p><strong>Especialidade:</strong> {item.metadata.specialization}</p>
                      )}
                      {item.metadata.desired_outcome && (
                        <p><strong>O que quer aprender:</strong> {item.metadata.desired_outcome}</p>
                      )}
                      {item.metadata.skills_missing && (
                        <p><strong>Habilidades faltantes:</strong> {item.metadata.skills_missing}</p>
                      )}
                      {item.metadata.job_role && (
                        <p><strong>Vaga/cargo:</strong> {item.metadata.job_role}</p>
                      )}
                      {item.metadata.company && (
                        <p><strong>Empresa:</strong> {item.metadata.company}</p>
                      )}
                      {item.metadata.job_link && (
                        <p><strong>Link da vaga:</strong> {item.metadata.job_link}</p>
                      )}
                      {item.metadata.urgency && (
                        <p><strong>Urgência:</strong> {item.metadata.urgency}</p>
                      )}
                      {item.metadata.experience_level && (
                        <p><strong>Nível desejado:</strong> {item.metadata.experience_level}</p>
                      )}
                      {item.metadata.preferred_format && (
                        <p><strong>Formato preferido:</strong> {item.metadata.preferred_format}</p>
                      )}
                      {item.metadata.tools_or_technologies && (
                        <p><strong>Ferramentas/tecnologias:</strong> {item.metadata.tools_or_technologies}</p>
                      )}
                      {item.metadata.additional_context && (
                        <p><strong>Detalhes extras:</strong> {item.metadata.additional_context}</p>
                      )}
                    </div>
                  )}

                  {item.tipo === 'moderacao_conteudo' && item.metadata && (
                    <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                      <p>Motivos: {(item.metadata.motivos || []).join(', ') || 'nao informado'}</p>
                      <p>Curso: {item.metadata.curso_titulo || 'nao identificado'}</p>
                      <p>Professor: {item.metadata.professor_nome || 'nao identificado'}</p>
                      {item.metadata.trecho && (
                        <p>Trecho: {item.metadata.trecho}</p>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap self-start">
                  {formatTimeAgo(item.criado_em)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
