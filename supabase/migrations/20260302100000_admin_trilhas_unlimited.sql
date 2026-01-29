-- Migration: Admin pode criar trilhas sem limite
-- Admin pode criar trilhas com qualquer curso, sem limite de quantidade

-- ============================================
-- 1. Atualizar trigger de limite de trilhas para ignorar admin
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
  v_is_admin boolean;
BEGIN
  -- Verificar se o usuario é admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.professor_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin não tem limite
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Professores tem limite de 3 trilhas
  SELECT COUNT(*) INTO v_count
  FROM public.trilhas
  WHERE professor_id = NEW.professor_id AND ativa = true;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Limite de 3 trilhas ativas por professor atingido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Atualizar trigger de limite de cursos para ignorar admin
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_cursos_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count integer;
  v_trilha_owner uuid;
  v_is_admin boolean;
BEGIN
  -- Buscar dono da trilha
  SELECT professor_id INTO v_trilha_owner
  FROM public.trilhas WHERE id = NEW.trilha_id;

  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_trilha_owner AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin não tem limite
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Professores tem limite de 5 cursos
  SELECT COUNT(*) INTO v_count
  FROM public.trilha_cursos
  WHERE trilha_id = NEW.trilha_id;

  IF v_count >= 5 THEN
    RAISE EXCEPTION 'Limite de 5 cursos por trilha atingido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Atualizar validação de proprietário do curso para permitir admin
-- ============================================

CREATE OR REPLACE FUNCTION public.check_trilha_curso_owner()
RETURNS TRIGGER AS $$
DECLARE
  v_trilha_professor_id uuid;
  v_curso_professor_id uuid;
  v_is_admin boolean;
BEGIN
  SELECT professor_id INTO v_trilha_professor_id
  FROM public.trilhas WHERE id = NEW.trilha_id;

  -- Verificar se é admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_trilha_professor_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin pode usar qualquer curso
  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  SELECT professor_id INTO v_curso_professor_id
  FROM public.cursos WHERE id = NEW.curso_id;

  IF v_trilha_professor_id != v_curso_professor_id THEN
    RAISE EXCEPTION 'O curso deve pertencer ao mesmo professor da trilha';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Política para admin gerenciar todas as trilhas
-- ============================================

-- Admin pode criar trilhas
CREATE POLICY "Admins podem criar trilhas"
  ON public.trilhas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Admin pode atualizar qualquer trilha
CREATE POLICY "Admins podem atualizar trilhas"
  ON public.trilhas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Admin pode deletar qualquer trilha
CREATE POLICY "Admins podem deletar trilhas"
  ON public.trilhas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Admin pode gerenciar trilha_cursos de qualquer trilha
CREATE POLICY "Admins podem inserir trilha_cursos"
  ON public.trilha_cursos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins podem deletar trilha_cursos"
  ON public.trilha_cursos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins podem atualizar trilha_cursos"
  ON public.trilha_cursos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));
