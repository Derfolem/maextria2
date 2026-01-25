CREATE OR REPLACE FUNCTION public.delete_course_full(curso_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  course_owner uuid;
  has_curso_id boolean;
  has_aula_id boolean;
  has_referencia_id boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Nao autorizado';
  END IF;

  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  SELECT professor_id INTO course_owner FROM public.cursos WHERE id = curso_id;

  IF course_owner IS NULL THEN
    RETURN;
  END IF;

  IF NOT is_admin AND course_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Nao autorizado';
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

  DELETE FROM public.cursos WHERE id = curso_id;
END;
$$;
