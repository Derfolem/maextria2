-- Migration: Objetivos Profissionais do Aluno
-- Permite que alunos definam metas de certificacao e acompanhem progresso

-- ============================================
-- 1. Tabela: objetivos_aluno
-- ============================================

CREATE TABLE IF NOT EXISTS public.objetivos_aluno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objetivo_profissional text NOT NULL,
  o_que_quer_alcancar text,
  prazo_meses integer NOT NULL DEFAULT 12,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),

  UNIQUE(usuario_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_objetivos_aluno_usuario ON public.objetivos_aluno(usuario_id);

-- Comentarios
COMMENT ON TABLE public.objetivos_aluno IS 'Objetivos profissionais definidos pelo aluno';
COMMENT ON COLUMN public.objetivos_aluno.objetivo_profissional IS 'Objetivo profissional do aluno';
COMMENT ON COLUMN public.objetivos_aluno.o_que_quer_alcancar IS 'O que o aluno quer alcançar';
COMMENT ON COLUMN public.objetivos_aluno.prazo_meses IS 'Prazo em meses para atingir o objetivo';

-- ============================================
-- 2. Tabela: objetivos_cursos (cursos que o aluno quer concluir)
-- ============================================

CREATE TABLE IF NOT EXISTS public.objetivos_cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objetivo_id uuid NOT NULL REFERENCES public.objetivos_aluno(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),

  UNIQUE(objetivo_id, curso_id)
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_objetivos_cursos_objetivo ON public.objetivos_cursos(objetivo_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_cursos_curso ON public.objetivos_cursos(curso_id);

-- Comentarios
COMMENT ON TABLE public.objetivos_cursos IS 'Cursos que o aluno definiu como meta';

-- ============================================
-- 3. Politicas RLS - objetivos_aluno
-- ============================================

ALTER TABLE public.objetivos_aluno ENABLE ROW LEVEL SECURITY;

-- Usuario pode ver seu proprio objetivo
CREATE POLICY "Usuarios veem seus objetivos"
  ON public.objetivos_aluno FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuario pode criar seu objetivo
CREATE POLICY "Usuarios podem criar objetivos"
  ON public.objetivos_aluno FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Usuario pode atualizar seu objetivo
CREATE POLICY "Usuarios podem atualizar objetivos"
  ON public.objetivos_aluno FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Usuario pode deletar seu objetivo
CREATE POLICY "Usuarios podem deletar objetivos"
  ON public.objetivos_aluno FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================
-- 4. Politicas RLS - objetivos_cursos
-- ============================================

ALTER TABLE public.objetivos_cursos ENABLE ROW LEVEL SECURITY;

-- Usuario pode ver seus cursos de objetivo
CREATE POLICY "Usuarios veem seus cursos de objetivo"
  ON public.objetivos_cursos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.objetivos_aluno o
    WHERE o.id = objetivo_id AND o.usuario_id = auth.uid()
  ));

-- Usuario pode inserir cursos no seu objetivo
CREATE POLICY "Usuarios podem inserir cursos no objetivo"
  ON public.objetivos_cursos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.objetivos_aluno o
    WHERE o.id = objetivo_id AND o.usuario_id = auth.uid()
  ));

-- Usuario pode deletar cursos do seu objetivo
CREATE POLICY "Usuarios podem deletar cursos do objetivo"
  ON public.objetivos_cursos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.objetivos_aluno o
    WHERE o.id = objetivo_id AND o.usuario_id = auth.uid()
  ));
