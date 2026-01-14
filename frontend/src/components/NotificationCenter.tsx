import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FaBell } from 'react-icons/fa';
import { useAuthStore } from '../lib/store';

type NotificationCenterProps = {
  title: string;
  subtitle: string;
  role: 'student' | 'teacher';
};

export default function NotificationCenter({ title, subtitle, role }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Array<any>>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<Array<any>>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  const loadNotifications = async () => {
    setThreadsLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id ?? null;
      setCurrentUserId(userId);

      const recipientRoles = role === 'teacher' ? ['teacher', 'all'] : ['student', 'all'];
      const { data: threadsData } = await supabase
        .from('internal_threads')
        .select('id, subject, created_at, recipient_role, expires_at, internal_messages!inner(id)')
        .eq('type', 'broadcast')
        .eq('created_by_role', 'admin')
        .in('recipient_role', recipientRoles)
        .order('created_at', { ascending: false });

      setThreads(threadsData || []);
      if ((threadsData || []).length > 0) {
        setSelectedThreadId(threadsData?.[0]?.id ?? null);
      } else {
        setSelectedThreadId(null);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setThreadsLoading(false);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    setMessagesLoading(true);
    try {
      const { data } = await supabase
        .from('internal_messages')
        .select('id, body, created_at, sender_id, sender_role')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      const messages = data || [];
      setThreadMessages(messages);
      await recordReceipts(messages);
    } catch (error) {
      console.error('Error loading notification messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const recordReceipts = async (messages: Array<any>) => {
    if (!currentUserId || messages.length === 0) return;
    const receiptPayload = messages
      .filter((message) => message.sender_id !== currentUserId)
      .map((message) => ({ message_id: message.id, user_id: currentUserId }));
    if (receiptPayload.length === 0) return;
    await supabase
      .from('internal_message_receipts')
      .upsert(receiptPayload, { onConflict: 'message_id,user_id' });
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

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId);

  return (
    <div className="max-w-6xl mx-auto px-[clamp(24px,5vw,80px)] py-[clamp(40px,6vh,80px)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-10">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Notificacoes</p>
          <h1 className="headline-font text-4xl md:text-5xl">{title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{subtitle}</p>
        </div>
        <div className="hidden md:flex items-center gap-3 rounded-[16px] border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
          <FaBell />
          <span>Atualizado automaticamente</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))] mb-4">
            Comunicados do admin
          </p>
          {threadsLoading ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando notificacoes...</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhuma notificacao recente.</p>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left rounded-[12px] border p-3 transition ${
                    selectedThreadId === thread.id
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]'
                  }`}
                >
                  <p className="font-semibold">{thread.subject}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    {formatTimeAgo(thread.created_at)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">Detalhes</p>
              <h2 className="text-xl font-semibold">{selectedThread?.subject || 'Selecione um comunicado'}</h2>
            </div>
            {selectedThread && (
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {formatTimeAgo(selectedThread.created_at)}
              </span>
            )}
          </div>

          {selectedThreadId ? (
            messagesLoading ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Carregando mensagem...</p>
            ) : threadMessages.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Nenhum conteudo encontrado.</p>
            ) : (
              <div className="space-y-3">
                {threadMessages.map((message) => (
                  <div key={message.id} className="rounded-[12px] border border-black bg-black text-white p-4">
                    <p className="text-sm whitespace-pre-line">{message.body}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3">
                      {new Date(message.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Selecione um comunicado ao lado.</p>
          )}
        </div>
      </div>

      {user?.role === 'teacher' && (
        <p className="mt-8 text-xs text-[hsl(var(--muted-foreground))]">
          Comunicados enviados pela equipe MAEXTRIA para professores.
        </p>
      )}
      {user?.role === 'student' && (
        <p className="mt-8 text-xs text-[hsl(var(--muted-foreground))]">
          Comunicados enviados pela equipe MAEXTRIA para alunos.
        </p>
      )}
    </div>
  );
}
