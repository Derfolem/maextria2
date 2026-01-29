-- Migration: Sistema de Trilhas de Estudo
-- Permite que professores agrupem cursos em trilhas
-- Alunos podem se matricular em todos os cursos de uma trilha de uma vez

-- ============================================
-- 1. Tabela: trilhas
-- ============================================

CREATE TABLE IF NOT EXISTS public.trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ativa boolean DEFAULT true,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trilhas_professor ON public.trilhas(professor_id);
CREATE INDEX IF NOT EXISTS idx_trilhas_ativa ON public.trilhas(ativa);

-- Comentários
COMMENT ON TABLE public.trilhas IS 'Trilhas de estudo criadas por professores';
COMMENT ON COLUMN public.trilhas.nome IS 'Nome da trilha de estudo';
COMMENT ON COLUMN public.trilhas.professor_id IS 'Professor que criou a trilha';
COMMENT ON COLUMN public.trilhas.ativa IS 'Se a trilha está ativa e visível na vitrine';

-- ============================================
-- 2. Tabela: trilha_cursos (relacionamento N:N)
-- ============================================

CREATE TABLE IF NOT EXISTS public.trilha_cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id uuid NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz DEFAULT now(),

  UNIQUE(trilha_id, curso_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trilha_cursos_trilha ON public.trilha_cursos(trilha_id);
CREATE INDEX IF NOT EXISTS idx_trilha_cursos_curso ON public.trilha_cursos(curso_id);

-- Comentários
COMMENT ON TABLE public.trilha_cursos IS 'Relacionamento entre trilhas e cursos';
COMMENT ON COLUMN public.trilha_cursos.ordem IS 'Ordem do curso dentro da trilha';

-- ============================================
-- 3. Tabela: matriculas_trilha
-- ============================================

CREATE TABLE IF NOT EXISTS public.matriculas_trilha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trilha_id uuid NOT NULL REFERENCES public.trilhas(id) ON DELETE CASCADE,
  data_matricula timestamptz DEFAULT now(),

  UNIQUE(usuario_id, trilha_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_matriculas_trilha_usuario ON public.matriculas_trilha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_trilha_trilha ON public.matriculas_trilha(trilha_id);

-- Comentários
COMMENT ON TABLE public.matriculas_trilha IS 'Registro de matrícula do aluno em trilhas';

-- ============================================
-- 4. Função: Verificar limite de trilhas por professor
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.trilhas
  WHERE professor_id = NEW.professor_id AND ativa = true;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 trilhas ativas por professor atingido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar limite
DROP TRIGGER IF EXISTS trilha_limit_check ON public.trilhas;
CREATE TRIGGER trilha_limit_check
  BEFORE INSERT ON public.trilhas
  FOR EACH ROW
  WHEN (NEW.ativa = true)
  EXECUTE FUNCTION public.check_trilha_limit();

-- ============================================
-- 5. Função: Verificar limite de cursos por trilha
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_cursos_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.trilha_cursos
  WHERE trilha_id = NEW.trilha_id;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Limite de 5 cursos por trilha atingido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar limite
DROP TRIGGER IF EXISTS trilha_cursos_limit_check ON public.trilha_cursos;
CREATE TRIGGER trilha_cursos_limit_check
  BEFORE INSERT ON public.trilha_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trilha_cursos_limit();

-- ============================================
-- 6. Função: Validar que curso pertence ao professor da trilha
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_curso_owner()
RETURNS TRIGGER AS $$
DECLARE
  v_trilha_professor_id uuid;
  v_curso_professor_id uuid;
BEGIN
  SELECT professor_id INTO v_trilha_professor_id
  FROM public.trilhas WHERE id = NEW.trilha_id;

  SELECT professor_id INTO v_curso_professor_id
  FROM public.cursos WHERE id = NEW.curso_id;

  IF v_trilha_professor_id != v_curso_professor_id THEN
    RAISE EXCEPTION 'O curso deve pertencer ao mesmo professor da trilha';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar proprietário
DROP TRIGGER IF EXISTS trilha_curso_owner_check ON public.trilha_cursos;
CREATE TRIGGER trilha_curso_owner_check
  BEFORE INSERT ON public.trilha_cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trilha_curso_owner();

-- ============================================
-- 7. Função RPC: Matricular em trilha (matrícula em lote)
-- ============================================

CREATE OR REPLACE FUNCTION public.matricular_trilha(p_trilha_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_curso_id uuid;
  v_cursos_matriculados integer := 0;
  v_trilha_ativa boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verificar se trilha está ativa
  SELECT ativa INTO v_trilha_ativa FROM public.trilhas WHERE id = p_trilha_id;

  IF v_trilha_ativa IS NULL THEN
    RAISE EXCEPTION 'Trilha não encontrada';
  END IF;

  IF NOT v_trilha_ativa THEN
    RAISE EXCEPTION 'Trilha não está ativa';
  END IF;

  -- Registrar na tabela de matriculas_trilha
  INSERT INTO public.matriculas_trilha (usuario_id, trilha_id)
  VALUES (v_user_id, p_trilha_id)
  ON CONFLICT (usuario_id, trilha_id) DO NOTHING;

  -- Matricular em todos os cursos da trilha
  FOR v_curso_id IN
    SELECT tc.curso_id
    FROM public.trilha_cursos tc
    INNER JOIN public.cursos c ON tc.curso_id = c.id
    WHERE tc.trilha_id = p_trilha_id
      AND c.ativo = true
    ORDER BY tc.ordem
  LOOP
    INSERT INTO public.matriculas (usuario_id, curso_id)
    VALUES (v_user_id, v_curso_id)
    ON CONFLICT (usuario_id, curso_id) DO NOTHING;
    v_cursos_matriculados := v_cursos_matriculados + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'trilha_id', p_trilha_id,
    'cursos_matriculados', v_cursos_matriculados
  );
END;
$$;

-- ============================================
-- 8. Políticas RLS - Trilhas
-- ============================================

ALTER TABLE public.trilhas ENABLE ROW LEVEL SECURITY;

-- Leitura pública de trilhas ativas
CREATE POLICY "Trilhas ativas são públicas"
  ON public.trilhas FOR SELECT
  USING (ativa = true);

-- Professores veem todas as suas trilhas (ativas e inativas)
CREATE POLICY "Professores veem suas trilhas"
  ON public.trilhas FOR SELECT
  USING (auth.uid() = professor_id);

-- Professores podem criar trilhas
CREATE POLICY "Professores podem criar trilhas"
  ON public.trilhas FOR INSERT
  WITH CHECK (auth.uid() = professor_id);

-- Professores podem atualizar suas trilhas
CREATE POLICY "Professores podem atualizar trilhas"
  ON public.trilhas FOR UPDATE
  USING (auth.uid() = professor_id);

-- Professores podem deletar suas trilhas
CREATE POLICY "Professores podem deletar trilhas"
  ON public.trilhas FOR DELETE
  USING (auth.uid() = professor_id);

-- Admins veem todas trilhas
CREATE POLICY "Admins veem todas trilhas"
  ON public.trilhas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- 9. Políticas RLS - Trilha Cursos
-- ============================================

ALTER TABLE public.trilha_cursos ENABLE ROW LEVEL SECURITY;

-- Leitura pública
CREATE POLICY "Trilha cursos são públicos para leitura"
  ON public.trilha_cursos FOR SELECT
  USING (true);

-- Professores gerenciam trilha_cursos de suas trilhas
CREATE POLICY "Professores podem inserir trilha_cursos"
  ON public.trilha_cursos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.trilhas t
    WHERE t.id = trilha_id AND t.professor_id = auth.uid()
  ));

CREATE POLICY "Professores podem deletar trilha_cursos"
  ON public.trilha_cursos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.trilhas t
    WHERE t.id = trilha_id AND t.professor_id = auth.uid()
  ));

CREATE POLICY "Professores podem atualizar trilha_cursos"
  ON public.trilha_cursos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.trilhas t
    WHERE t.id = trilha_id AND t.professor_id = auth.uid()
  ));

-- ============================================
-- 10. Políticas RLS - Matrículas Trilha
-- ============================================

ALTER TABLE public.matriculas_trilha ENABLE ROW LEVEL SECURITY;

-- Usuários veem suas próprias matrículas de trilha
CREATE POLICY "Usuários veem suas matriculas_trilha"
  ON public.matriculas_trilha FOR SELECT
  USING (auth.uid() = usuario_id);

-- Sistema pode inserir matrículas (via RPC)
CREATE POLICY "Sistema insere matriculas_trilha"
  ON public.matriculas_trilha FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Professores podem ver matrículas em suas trilhas
CREATE POLICY "Professores veem matriculas em suas trilhas"
  ON public.matriculas_trilha FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.trilhas t
    WHERE t.id = trilha_id AND t.professor_id = auth.uid()
  ));

-- Admins veem todas matrículas de trilha
CREATE POLICY "Admins veem todas matriculas_trilha"
  ON public.matriculas_trilha FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ============================================
-- 11. Permissões
-- ============================================

GRANT EXECUTE ON FUNCTION public.matricular_trilha(uuid) TO authenticated;
