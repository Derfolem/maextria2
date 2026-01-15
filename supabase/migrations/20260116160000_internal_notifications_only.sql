-- Restrict internal messaging to admin notifications only
DROP POLICY IF EXISTS "Usuarios podem ver threads internas" ON public.internal_threads;
DROP POLICY IF EXISTS "Alunos podem abrir duvidas" ON public.internal_threads;
DROP POLICY IF EXISTS "Professores podem enviar comunicados" ON public.internal_threads;
DROP POLICY IF EXISTS "Admins podem enviar comunicados" ON public.internal_threads;
DROP POLICY IF EXISTS "Admins podem deletar seus comunicados" ON public.internal_threads;

CREATE POLICY "Usuarios podem ver notificacoes internas"
  ON public.internal_threads
  FOR SELECT
  USING (
    (public.has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid())
    OR (
      type = 'broadcast'
      AND created_by_role = 'admin'
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
        OR (
          recipient_role = 'student'
          AND NOT public.has_role(auth.uid(), 'admin'::app_role)
          AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
        )
        OR (
          recipient_role = 'all'
          AND (
            public.has_role(auth.uid(), 'teacher'::app_role)
            OR (
              NOT public.has_role(auth.uid(), 'admin'::app_role)
              AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
            )
          )
        )
      )
    )
  );

CREATE POLICY "Admins podem criar notificacoes internas"
  ON public.internal_threads
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND created_by = auth.uid()
    AND type = 'broadcast'
    AND recipient_role IN ('student', 'teacher', 'all')
    AND created_by_role = 'admin'
  );

CREATE POLICY "Admins podem deletar notificacoes internas"
  ON public.internal_threads
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Usuarios podem ver mensagens internas" ON public.internal_messages;
DROP POLICY IF EXISTS "Usuarios podem enviar mensagens internas" ON public.internal_messages;
DROP POLICY IF EXISTS "Usuarios podem deletar mensagens internas" ON public.internal_messages;

CREATE POLICY "Usuarios podem ver notificacoes internas (mensagens)"
  ON public.internal_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_threads t
      WHERE t.id = internal_messages.thread_id
        AND (
          (public.has_role(auth.uid(), 'admin'::app_role) AND t.created_by = auth.uid())
          OR (
            t.type = 'broadcast'
            AND t.created_by_role = 'admin'
            AND (t.expires_at IS NULL OR t.expires_at > now())
            AND (
              (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (
                t.recipient_role = 'student'
                AND NOT public.has_role(auth.uid(), 'admin'::app_role)
                AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
              )
              OR (
                t.recipient_role = 'all'
                AND (
                  public.has_role(auth.uid(), 'teacher'::app_role)
                  OR (
                    NOT public.has_role(auth.uid(), 'admin'::app_role)
                    AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
                  )
                )
              )
            )
          )
        )
    )
  );

CREATE POLICY "Admins podem enviar notificacoes internas (mensagens)"
  ON public.internal_messages
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.internal_threads t
      WHERE t.id = internal_messages.thread_id
        AND t.created_by = auth.uid()
        AND t.type = 'broadcast'
    )
  );

CREATE POLICY "Admins podem deletar mensagens internas (notificacoes)"
  ON public.internal_messages
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuarios podem ver recibos proprios ou de seus comunicados" ON public.internal_message_receipts;
DROP POLICY IF EXISTS "Usuarios podem registrar recebimento interno" ON public.internal_message_receipts;

CREATE POLICY "Usuarios podem ver recibos proprios ou de suas notificacoes"
  ON public.internal_message_receipts
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      public.has_role(auth.uid(), 'admin'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.internal_messages m
        JOIN public.internal_threads t ON t.id = m.thread_id
        WHERE m.id = internal_message_receipts.message_id
          AND t.type = 'broadcast'
          AND t.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Usuarios podem registrar recebimento de notificacoes"
  ON public.internal_message_receipts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.internal_messages m
      JOIN public.internal_threads t ON t.id = m.thread_id
      WHERE m.id = internal_message_receipts.message_id
        AND (
          (public.has_role(auth.uid(), 'admin'::app_role) AND t.created_by = auth.uid())
          OR (
            t.type = 'broadcast'
            AND t.created_by_role = 'admin'
            AND (t.expires_at IS NULL OR t.expires_at > now())
            AND (
              (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (
                t.recipient_role = 'student'
                AND NOT public.has_role(auth.uid(), 'admin'::app_role)
                AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
              )
              OR (
                t.recipient_role = 'all'
                AND (
                  public.has_role(auth.uid(), 'teacher'::app_role)
                  OR (
                    NOT public.has_role(auth.uid(), 'admin'::app_role)
                    AND NOT public.has_role(auth.uid(), 'teacher'::app_role)
                  )
                )
              )
            )
          )
        )
    )
  );

CREATE OR REPLACE FUNCTION public.set_internal_thread_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type = 'broadcast' AND NEW.expires_at IS NULL THEN
    NEW.expires_at = now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_internal_threads_expiration ON public.internal_threads;
CREATE TRIGGER trg_internal_threads_expiration
BEFORE INSERT ON public.internal_threads
FOR EACH ROW
EXECUTE FUNCTION public.set_internal_thread_expiration();

CREATE OR REPLACE FUNCTION public.cleanup_internal_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.internal_threads
  WHERE type = 'broadcast'
    AND expires_at IS NOT NULL
    AND expires_at <= now();
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_internal_notifications') THEN
    PERFORM cron.schedule(
      'cleanup_internal_notifications',
      '0 3 * * *',
      $$select public.cleanup_internal_notifications();$$
    );
  END IF;
END;
$$;
