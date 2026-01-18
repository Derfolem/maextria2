-- Allow student broadcasts without enrollment when course_id is null
DROP POLICY IF EXISTS "Usuarios podem ver threads internas" ON public.internal_threads;
CREATE POLICY "Usuarios podem ver threads internas"
  ON public.internal_threads
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR (
      type = 'course_question'
      AND course_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.cursos c
        WHERE c.id = internal_threads.course_id
          AND c.professor_id = auth.uid()
      )
    )
    OR (
      type = 'broadcast'
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        (recipient_role = 'student' AND (
          (course_id IS NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) AND NOT public.has_role(auth.uid(), 'teacher'::app_role))
          OR EXISTS (
            SELECT 1 FROM public.matriculas m
            WHERE m.usuario_id = auth.uid()
              AND (internal_threads.course_id IS NULL OR m.curso_id = internal_threads.course_id)
          )
        ))
        OR (recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
        OR (recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );

DROP POLICY IF EXISTS "Usuarios podem ver mensagens internas" ON public.internal_messages;
CREATE POLICY "Usuarios podem ver mensagens internas"
  ON public.internal_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.internal_threads t
      WHERE t.id = internal_messages.thread_id
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
                  SELECT 1 FROM public.matriculas m
                  WHERE m.usuario_id = auth.uid()
                    AND (t.course_id IS NULL OR m.curso_id = t.course_id)
                )
              ))
              OR (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (t.recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
            )
          )
        )
    )
  );
