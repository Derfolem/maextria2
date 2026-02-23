CREATE TABLE IF NOT EXISTS public.modulos_desbloqueados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modulo_id TEXT NOT NULL,
  desbloqueado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, modulo_id)
);

ALTER TABLE public.modulos_desbloqueados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aluno_ver_seus_desbloqueios"
  ON public.modulos_desbloqueados
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "aluno_desbloquear_modulo"
  ON public.modulos_desbloqueados
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Admin pode ver tudo
CREATE POLICY "admin_ver_desbloqueios"
  ON public.modulos_desbloqueados
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
