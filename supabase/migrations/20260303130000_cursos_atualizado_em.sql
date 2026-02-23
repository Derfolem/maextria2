-- Adiciona coluna atualizado_em na tabela cursos
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- Inicializa com criado_em para registros existentes
UPDATE public.cursos SET atualizado_em = criado_em WHERE atualizado_em IS NULL;

-- -------------------------------------------------------
-- Trigger 1: atualizar atualizado_em no proprio UPDATE de cursos
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_cursos_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cursos_set_atualizado_em ON public.cursos;
CREATE TRIGGER trg_cursos_set_atualizado_em
  BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION fn_cursos_set_atualizado_em();

-- -------------------------------------------------------
-- Trigger 2: qualquer mudanca em modulos toca o curso pai
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_curso_via_modulo()
RETURNS TRIGGER AS $$
DECLARE
  v_curso_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_curso_id := OLD.curso_id;
  ELSE
    v_curso_id := NEW.curso_id;
  END IF;
  UPDATE public.cursos SET atualizado_em = now() WHERE id = v_curso_id;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_curso_via_modulo ON public.modulos;
CREATE TRIGGER trg_touch_curso_via_modulo
  AFTER INSERT OR UPDATE OR DELETE ON public.modulos
  FOR EACH ROW EXECUTE FUNCTION fn_touch_curso_via_modulo();

-- -------------------------------------------------------
-- Trigger 3: qualquer mudanca em aulas toca o curso pai
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_curso_via_aula()
RETURNS TRIGGER AS $$
DECLARE
  v_modulo_id UUID;
  v_curso_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_modulo_id := OLD.modulo_id;
  ELSE
    v_modulo_id := NEW.modulo_id;
  END IF;
  SELECT curso_id INTO v_curso_id FROM public.modulos WHERE id = v_modulo_id;
  IF v_curso_id IS NOT NULL THEN
    UPDATE public.cursos SET atualizado_em = now() WHERE id = v_curso_id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_curso_via_aula ON public.aulas;
CREATE TRIGGER trg_touch_curso_via_aula
  AFTER INSERT OR UPDATE OR DELETE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION fn_touch_curso_via_aula();
