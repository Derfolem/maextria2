-- Track received messages for internal broadcasts
CREATE TABLE IF NOT EXISTS public.internal_message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.internal_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_internal_message_receipts_message
  ON public.internal_message_receipts (message_id);

CREATE INDEX IF NOT EXISTS idx_internal_message_receipts_user
  ON public.internal_message_receipts (user_id);

ALTER TABLE public.internal_message_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver recibos proprios ou de seus comunicados"
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

CREATE POLICY "Usuarios podem registrar recebimento interno"
  ON public.internal_message_receipts
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.internal_messages m
      JOIN public.internal_threads t ON t.id = m.thread_id
      WHERE m.id = internal_message_receipts.message_id
        AND (
          t.created_by = auth.uid()
          OR (
            t.type = 'course_question'
            AND t.course_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.cursos c
              WHERE c.id = t.course_id
                AND c.professor_id = auth.uid()
            )
          )
          OR (
            t.type = 'broadcast'
            AND (t.expires_at IS NULL OR t.expires_at > now())
            AND (
              (t.recipient_role = 'student' AND EXISTS (
                SELECT 1 FROM public.matriculas m2
                WHERE m2.usuario_id = auth.uid()
                  AND (t.course_id IS NULL OR m2.curso_id = t.course_id)
              ))
              OR (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (t.recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
            )
          )
        )
    )
  );
