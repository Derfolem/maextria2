CREATE OR REPLACE FUNCTION public.delete_course_full(curso_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  course_owner uuid;
  course_active boolean;
  course_exists boolean;
  has_curso_id boolean;
  has_aula_id boolean;
  has_referencia_id boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  SELECT professor_id, ativo INTO course_owner, course_active FROM public.cursos WHERE id = curso_id;
  course_exists := FOUND;

  IF NOT course_exists THEN
    RAISE EXCEPTION 'Curso nao encontrado';
  END IF;

  IF NOT is_admin THEN
    IF course_owner IS NULL OR course_owner <> auth.uid() THEN
      RAISE EXCEPTION 'Nao autorizado';
    END IF;
    IF course_active IS TRUE THEN
      RAISE EXCEPTION 'Curso publicado nao pode ser excluido pelo professor';
    END IF;
  END IF;

  IF to_regclass('public.conteudo_moderacao') IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conteudo_moderacao' AND column_name = 'curso_id'
    ) INTO has_curso_id;
    IF has_curso_id THEN
      EXECUTE 'DELETE FROM public.conteudo_moderacao WHERE curso_id = $1' USING curso_id;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conteudo_moderacao' AND column_name = 'aula_id'
    ) INTO has_aula_id;
    IF has_aula_id THEN
      EXECUTE 'DELETE FROM public.conteudo_moderacao WHERE aula_id IN (SELECT a.id FROM public.aulas a JOIN public.modulos m ON m.id = a.modulo_id WHERE m.curso_id = $1)'
        USING curso_id;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'conteudo_moderacao' AND column_name = 'referencia_id'
    ) INTO has_referencia_id;
    IF has_referencia_id THEN
      EXECUTE 'DELETE FROM public.conteudo_moderacao WHERE referencia_id = $1' USING curso_id;
    END IF;
  END IF;

  IF to_regclass('public.admin_notifications') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.admin_notifications WHERE metadata->>''curso_id'' = $1' USING curso_id::text;
  END IF;

  IF to_regclass('public.comissoes_professores') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.comissoes_professores WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.transacoes_pagamento') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.transacoes_pagamento WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.certificados') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.certificados WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.prova_resultado') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.prova_resultado WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.prova_questoes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.prova_questoes WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.questionarios') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.questionarios WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.respostas_questionario') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.respostas_questionario WHERE questionario_id IN (SELECT id FROM public.questionarios WHERE curso_id = $1)'
      USING curso_id;
  END IF;

  IF to_regclass('public.matriculas') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.matriculas WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.modulos') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.modulos WHERE curso_id = $1' USING curso_id;
  END IF;

  IF to_regclass('public.curso_sugestoes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.curso_sugestoes WHERE curso_id = $1' USING curso_id;
  END IF;

  DELETE FROM public.cursos WHERE id = curso_id;
END;
$$;
