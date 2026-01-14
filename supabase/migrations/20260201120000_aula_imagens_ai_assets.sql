-- Table for lesson images (up to 3 per lesson)
CREATE TABLE IF NOT EXISTS public.aula_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ordem SMALLINT NOT NULL CHECK (ordem BETWEEN 1 AND 3),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (aula_id, ordem)
);

ALTER TABLE public.aula_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aula imagens sao publicas para leitura"
  ON public.aula_imagens FOR SELECT
  USING (true);

CREATE POLICY "Admins e professores podem criar imagens de aula"
  ON public.aula_imagens FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Admins e professores podem atualizar imagens de aula"
  ON public.aula_imagens FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Admins e professores podem deletar imagens de aula"
  ON public.aula_imagens FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'teacher'::app_role)
  );

-- Storage bucket for AI assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-assets', 'ai-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "AI assets sao publicos para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ai-assets');

CREATE POLICY "Usuarios autenticados podem enviar AI assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-assets'
    AND auth.role() = 'authenticated'
  );
