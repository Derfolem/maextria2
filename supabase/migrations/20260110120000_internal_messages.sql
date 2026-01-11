-- Internal messaging (threads + messages + deletions)
CREATE TABLE IF NOT EXISTS public.internal_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('course_question', 'broadcast')),
  subject TEXT NOT NULL,
  course_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.modulos(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_internal_threads_created_at
  ON public.internal_threads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_threads_course
  ON public.internal_threads (course_id);

CREATE TABLE IF NOT EXISTS public.internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.internal_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_internal_messages_thread
  ON public.internal_messages (thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_sender
  ON public.internal_messages (sender_id);

CREATE TABLE IF NOT EXISTS public.internal_message_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.internal_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.internal_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_message_deletions ENABLE ROW LEVEL SECURITY;

-- Thread access policies
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
        (recipient_role = 'student' AND EXISTS (
          SELECT 1 FROM public.matriculas m
          WHERE m.usuario_id = auth.uid()
            AND (internal_threads.course_id IS NULL OR m.curso_id = internal_threads.course_id)
        ))
        OR (recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
        OR (recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );

CREATE POLICY "Alunos podem abrir duvidas"
  ON public.internal_threads
  FOR INSERT
  WITH CHECK (
    type = 'course_question'
    AND created_by = auth.uid()
    AND course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.matriculas m
      WHERE m.usuario_id = auth.uid()
        AND m.curso_id = internal_threads.course_id
    )
  );

CREATE POLICY "Professores podem enviar comunicados"
  ON public.internal_threads
  FOR INSERT
  WITH CHECK (
    type = 'broadcast'
    AND created_by = auth.uid()
    AND recipient_role IN ('student', 'admin')
    AND (
      (recipient_role = 'student' AND course_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.cursos c
        WHERE c.id = internal_threads.course_id
          AND c.professor_id = auth.uid()
      ))
      OR (recipient_role = 'admin')
    )
  );

CREATE POLICY "Admins podem enviar comunicados"
  ON public.internal_threads
  FOR INSERT
  WITH CHECK (
    type = 'broadcast'
    AND created_by = auth.uid()
    AND recipient_role IN ('student', 'teacher')
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Messages access policies
CREATE POLICY "Usuarios podem ver mensagens internas"
  ON public.internal_messages
  FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.internal_message_deletions d
      WHERE d.message_id = internal_messages.id
        AND d.user_id = auth.uid()
    )
    AND EXISTS (
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
              (t.recipient_role = 'student' AND EXISTS (
                SELECT 1 FROM public.matriculas m
                WHERE m.usuario_id = auth.uid()
                  AND (t.course_id IS NULL OR m.curso_id = t.course_id)
              ))
              OR (t.recipient_role = 'teacher' AND public.has_role(auth.uid(), 'teacher'::app_role))
              OR (t.recipient_role = 'admin' AND public.has_role(auth.uid(), 'admin'::app_role))
            )
          )
        )
    )
  );

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
        )
    )
  );

-- Message deletion policy
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

-- Configs for internal mail blocking
INSERT INTO public.configuracoes_site (chave, valor, descricao) VALUES
  ('correio_interno_bloqueado', '0', 'Bloqueia o correio interno para alunos e professores (1 = bloqueado)'),
  ('correio_interno_mensagem', 'Correio interno temporariamente indisponivel.', 'Mensagem exibida quando o correio interno estiver bloqueado')
ON CONFLICT (chave) DO NOTHING;
