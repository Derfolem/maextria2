-- Align receipt access with updated student broadcast rules
DROP POLICY IF EXISTS "Usuarios podem registrar recebimento interno" ON public.internal_message_receipts;
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
              (t.recipient_role = 'student' AND (
                (t.course_id IS NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) AND NOT public.has_role(auth.uid(), 'teacher'::app_role))
                OR EXISTS (
                  SELECT 1 FROM public.matriculas m2
                  WHERE m2.usuario_id = auth.uid()
                    AND (t.course_id IS NULL OR m2.curso_id = t.course_id)
                )
              ))
              OR (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (t.recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
            )
          )
        )
    )
  );
