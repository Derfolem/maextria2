-- Add role metadata for labeling
ALTER TABLE public.internal_threads
  ADD COLUMN IF NOT EXISTS created_by_role TEXT;

ALTER TABLE public.internal_messages
  ADD COLUMN IF NOT EXISTS sender_role TEXT;

UPDATE public.internal_threads
SET created_by_role = CASE
  WHEN public.has_role(created_by, 'admin'::app_role) THEN 'admin'
  WHEN public.has_role(created_by, 'teacher'::app_role) THEN 'teacher'
  ELSE 'student'
END
WHERE created_by_role IS NULL;

UPDATE public.internal_messages
SET sender_role = CASE
  WHEN public.has_role(sender_id, 'admin'::app_role) THEN 'admin'
  WHEN public.has_role(sender_id, 'teacher'::app_role) THEN 'teacher'
  ELSE 'student'
END
WHERE sender_role IS NULL;

-- Allow admin to delete their own broadcast threads (hard delete for all recipients)
CREATE POLICY "Admins podem deletar seus comunicados"
  ON public.internal_threads
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND created_by = auth.uid()
    AND type = 'broadcast'
  );

-- Allow admin to reply to messages addressed to admin
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
          (t.type = 'course_question' AND (
            t.created_by = auth.uid()
            OR EXISTS (
              SELECT 1 FROM public.cursos c
              WHERE c.id = t.course_id
                AND c.professor_id = auth.uid()
            )
          ))
          OR (t.type = 'broadcast' AND t.created_by = auth.uid())
          OR (t.type = 'broadcast' AND t.recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
        )
    )
  );

-- Allow deletions for admin, but prevent student/teacher from deleting admin messages
DROP POLICY IF EXISTS "Usuarios podem excluir mensagens internas" ON public.internal_message_deletions;
CREATE POLICY "Usuarios podem excluir mensagens internas"
  ON public.internal_message_deletions
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.internal_messages m
      JOIN public.internal_threads t ON t.id = m.thread_id
      WHERE m.id = internal_message_deletions.message_id
        AND (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR (
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
        AND (
          public.has_role(auth.uid(), 'admin'::app_role)
          OR t.created_by_role IS DISTINCT FROM 'admin'
        )
    )
  );
