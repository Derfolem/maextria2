import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

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

    if (Math.abs(days) >= 1) {
      return relativeFormatter.format(-days, 'day');
    }
    if (Math.abs(hours) >= 1) {
      return relativeFormatter.format(-hours, 'hour');
    }
    if (Math.abs(minutes) >= 1) {
      return relativeFormatter.format(-minutes, 'minute');
    }
    return relativeFormatter.format(-diffSeconds, 'second');
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.tipo === filter;
  });

  return (
    <div className="max-w-7xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
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

      <div className="card">
        {loading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando notificacoes...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma notificacao encontrada.</p>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div key={item.id} className="flex flex-col gap-2 p-3 border border-[hsl(var(--border))] rounded-[12px] md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      {typeLabels[item.tipo] || item.tipo}
                    </span>
                  </div>
                  <p className="font-semibold">{item.titulo}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{item.descricao}</p>
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
                <span className="text-sm text-[hsl(var(--muted-foreground))] whitespace-nowrap">
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
