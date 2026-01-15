-- Reset notification policies to avoid recursion and enforce admin-only broadcasts
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'internal_messages' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.internal_messages', r.policyname);
  END LOOP;

  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'internal_threads' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.internal_threads', r.policyname);
  END LOOP;

  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'internal_message_receipts' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.internal_message_receipts', r.policyname);
  END LOOP;
END;
$$;

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
