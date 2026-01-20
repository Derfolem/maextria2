CREATE TABLE IF NOT EXISTS public.professor_dados_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  titular text NOT NULL,
  documento text NOT NULL,
  banco text NOT NULL,
  agencia text NOT NULL,
  conta text NOT NULL,
  tipo_conta text NOT NULL,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(usuario_id)
);

ALTER TABLE public.professor_dados_bancarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professores veem proprios dados bancarios"
  ON public.professor_dados_bancarios FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Professores inserem proprios dados bancarios"
  ON public.professor_dados_bancarios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Professores atualizam proprios dados bancarios"
  ON public.professor_dados_bancarios FOR UPDATE
  USING (auth.uid() = usuario_id);
