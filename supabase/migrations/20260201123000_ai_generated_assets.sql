-- Store AI generated assets for audit and cleanup
CREATE TABLE IF NOT EXISTS public.ai_generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('image', 'text')),
  url TEXT NOT NULL,
  storage_path TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generated_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver seus assets IA"
  ON public.ai_generated_assets FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar seus assets IA"
  ON public.ai_generated_assets FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem ver todos assets IA"
  ON public.ai_generated_assets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar assets IA"
  ON public.ai_generated_assets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios podem deletar seus assets IA"
  ON public.ai_generated_assets FOR DELETE
  USING (auth.uid() = usuario_id);
