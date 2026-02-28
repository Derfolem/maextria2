-- Tabela de presença online: registra o último acesso ativo de cada usuário
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT CHECK (role IN ('student', 'teacher', 'admin'))
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Usuário atualiza sua própria presença
CREATE POLICY "user_upsert_own_presence"
  ON public.user_presence
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin lê todas as presenças
CREATE POLICY "admin_read_all_presence"
  ON public.user_presence
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen
  ON public.user_presence (last_seen DESC);
