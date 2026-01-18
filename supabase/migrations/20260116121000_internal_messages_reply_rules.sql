-- Enforce reply rules for internal messages (admin/professor/aluno)
DROP POLICY IF EXISTS "Usuarios podem enviar mensagens internas" ON public.internal_messages;
CREATE POLICY "Usuarios podem enviar mensagens internas"
  ON public.internal_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.internal_threads t
      WHERE t.id = internal_messages.thread_id
        AND (
          (
            t.type = 'course_question'
            AND (
              t.created_by = auth.uid()
              OR EXISTS (
                SELECT 1 FROM public.cursos c
                WHERE c.id = t.course_id
                  AND c.professor_id = auth.uid()
              )
            )
          )
          OR (
            t.type = 'broadcast'
            AND (
              (
                t.recipient_role = 'admin'
                AND public.has_role(auth.uid(), 'admin'::app_role)
              )
              OR (
                t.created_by = auth.uid()
                AND NOT EXISTS (
                  SELECT 1 FROM public.internal_messages m2
                  WHERE m2.thread_id = t.id
                )
              )
            )
          )
        )
    )
  );
