-- Migration: Construtor de Curriculo do Aluno
-- Permite que alunos criem e gerenciem seus curriculos profissionais

-- ============================================
-- 1. Tabela: curriculos (principal)
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objetivo_profissional text,
  informacoes_adicionais text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),

  UNIQUE(usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_curriculos_usuario ON public.curriculos(usuario_id);

COMMENT ON TABLE public.curriculos IS 'Curriculo profissional do aluno';

-- ============================================
-- 2. Tabela: curriculo_formacao (educacao)
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculo_formacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculo_id uuid NOT NULL REFERENCES public.curriculos(id) ON DELETE CASCADE,
  instituicao text NOT NULL,
  grau text NOT NULL,
  area_estudo text,
  data_inicio date,
  data_fim date,
  em_andamento boolean DEFAULT false,
  descricao text,
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculo_formacao_curriculo ON public.curriculo_formacao(curriculo_id);

COMMENT ON TABLE public.curriculo_formacao IS 'Formacao academica do curriculo';

-- ============================================
-- 3. Tabela: curriculo_experiencia (trabalho)
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculo_experiencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculo_id uuid NOT NULL REFERENCES public.curriculos(id) ON DELETE CASCADE,
  empresa text NOT NULL,
  cargo text NOT NULL,
  localizacao text,
  data_inicio date,
  data_fim date,
  atual boolean DEFAULT false,
  descricao text,
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculo_experiencia_curriculo ON public.curriculo_experiencia(curriculo_id);

COMMENT ON TABLE public.curriculo_experiencia IS 'Experiencia profissional do curriculo';

-- ============================================
-- 4. Tabela: curriculo_certificados_externos
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculo_certificados_externos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculo_id uuid NOT NULL REFERENCES public.curriculos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  instituicao text NOT NULL,
  data_emissao date,
  data_validade date,
  url_credencial text,
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculo_certs_externos_curriculo ON public.curriculo_certificados_externos(curriculo_id);

COMMENT ON TABLE public.curriculo_certificados_externos IS 'Certificados externos adicionados manualmente';

-- ============================================
-- 5. Tabela: curriculo_habilidades
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculo_habilidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculo_id uuid NOT NULL REFERENCES public.curriculos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  nivel text CHECK(nivel IN ('basico', 'intermediario', 'avancado', 'expert')),
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculo_habilidades_curriculo ON public.curriculo_habilidades(curriculo_id);

COMMENT ON TABLE public.curriculo_habilidades IS 'Habilidades do curriculo';

-- ============================================
-- 6. Tabela: curriculo_idiomas
-- ============================================

CREATE TABLE IF NOT EXISTS public.curriculo_idiomas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculo_id uuid NOT NULL REFERENCES public.curriculos(id) ON DELETE CASCADE,
  idioma text NOT NULL,
  proficiencia text CHECK(proficiencia IN ('basico', 'intermediario', 'avancado', 'fluente', 'nativo')),
  ordem integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_curriculo_idiomas_curriculo ON public.curriculo_idiomas(curriculo_id);

COMMENT ON TABLE public.curriculo_idiomas IS 'Idiomas do curriculo';

-- ============================================
-- 7. Politicas RLS - curriculos
-- ============================================

ALTER TABLE public.curriculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seu curriculo"
  ON public.curriculos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar curriculo"
  ON public.curriculos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar curriculo"
  ON public.curriculos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar curriculo"
  ON public.curriculos FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================
-- 8. Politicas RLS - curriculo_formacao
-- ============================================

ALTER TABLE public.curriculo_formacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem sua formacao"
  ON public.curriculo_formacao FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar formacao"
  ON public.curriculo_formacao FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar formacao"
  ON public.curriculo_formacao FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar formacao"
  ON public.curriculo_formacao FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- ============================================
-- 9. Politicas RLS - curriculo_experiencia
-- ============================================

ALTER TABLE public.curriculo_experiencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem sua experiencia"
  ON public.curriculo_experiencia FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar experiencia"
  ON public.curriculo_experiencia FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar experiencia"
  ON public.curriculo_experiencia FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar experiencia"
  ON public.curriculo_experiencia FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- ============================================
-- 10. Politicas RLS - curriculo_certificados_externos
-- ============================================

ALTER TABLE public.curriculo_certificados_externos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seus certs externos"
  ON public.curriculo_certificados_externos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar certs externos"
  ON public.curriculo_certificados_externos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar certs externos"
  ON public.curriculo_certificados_externos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar certs externos"
  ON public.curriculo_certificados_externos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- ============================================
-- 11. Politicas RLS - curriculo_habilidades
-- ============================================

ALTER TABLE public.curriculo_habilidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem suas habilidades"
  ON public.curriculo_habilidades FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar habilidades"
  ON public.curriculo_habilidades FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar habilidades"
  ON public.curriculo_habilidades FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar habilidades"
  ON public.curriculo_habilidades FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- ============================================
-- 12. Politicas RLS - curriculo_idiomas
-- ============================================

ALTER TABLE public.curriculo_idiomas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seus idiomas"
  ON public.curriculo_idiomas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar idiomas"
  ON public.curriculo_idiomas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar idiomas"
  ON public.curriculo_idiomas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar idiomas"
  ON public.curriculo_idiomas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));
