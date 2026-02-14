-- Make moderation non-blocking for course/module/lesson saves.
-- If moderation logging fails, content creation must still succeed.

DO $$
BEGIN
  IF to_regclass('public.conteudo_moderacao') IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conteudo_moderacao'
      AND column_name = 'motivos'
  ) THEN
    EXECUTE 'ALTER TABLE public.conteudo_moderacao ALTER COLUMN motivos SET DEFAULT ''{}''::text[]';
    EXECUTE 'UPDATE public.conteudo_moderacao SET motivos = ''{}''::text[] WHERE motivos IS NULL';
    EXECUTE 'ALTER TABLE public.conteudo_moderacao ALTER COLUMN motivos SET NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conteudo_moderacao'
      AND column_name = 'palavras_detectadas'
  ) THEN
    EXECUTE 'ALTER TABLE public.conteudo_moderacao ALTER COLUMN palavras_detectadas SET DEFAULT ''{}''::text[]';
    EXECUTE 'UPDATE public.conteudo_moderacao SET palavras_detectadas = ''{}''::text[] WHERE palavras_detectadas IS NULL';
    EXECUTE 'ALTER TABLE public.conteudo_moderacao ALTER COLUMN palavras_detectadas SET NOT NULL';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_conteudo_moderacao(
  _usuario_id uuid,
  _tipo text,
  _referencia_id uuid,
  _conteudo text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reasons text[];
  snippet text;
  course_id uuid;
  course_title text;
  professor_id uuid;
  professor_name text;
  resolved_professor_id uuid;
  has_professor_id boolean;
  has_palavras_detectadas boolean;
BEGIN
  reasons := public.detect_moderation_reasons(_conteudo);
  IF reasons IS NULL OR array_length(reasons, 1) IS NULL THEN
    RETURN;
  END IF;

  snippet := left(regexp_replace(COALESCE(_conteudo, ''), '[[:space:]]+', ' ', 'g'), 220);

  IF _tipo = 'curso' THEN
    SELECT id, titulo, professor_id, professor_nome
      INTO course_id, course_title, professor_id, professor_name
      FROM public.cursos
      WHERE id = _referencia_id;
  ELSIF _tipo = 'modulo' THEN
    SELECT c.id, c.titulo, c.professor_id, c.professor_nome
      INTO course_id, course_title, professor_id, professor_name
      FROM public.modulos m
      JOIN public.cursos c ON c.id = m.curso_id
      WHERE m.id = _referencia_id;
  ELSIF _tipo = 'aula' THEN
    SELECT c.id, c.titulo, c.professor_id, c.professor_nome
      INTO course_id, course_title, professor_id, professor_name
      FROM public.aulas a
      JOIN public.modulos m ON m.id = a.modulo_id
      JOIN public.cursos c ON c.id = m.curso_id
      WHERE a.id = _referencia_id;
  END IF;

  resolved_professor_id := COALESCE(professor_id, _usuario_id, auth.uid());

  has_professor_id := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conteudo_moderacao'
      AND column_name = 'professor_id'
  );

  has_palavras_detectadas := EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conteudo_moderacao'
      AND column_name = 'palavras_detectadas'
  );

  BEGIN
    IF has_professor_id AND has_palavras_detectadas THEN
      INSERT INTO public.conteudo_moderacao (
        usuario_id,
        professor_id,
        tipo,
        referencia_id,
        trecho,
        motivos,
        palavras_detectadas
      )
      VALUES (
        _usuario_id,
        resolved_professor_id,
        _tipo,
        _referencia_id,
        snippet,
        reasons,
        reasons
      );
    ELSIF has_professor_id THEN
      INSERT INTO public.conteudo_moderacao (
        usuario_id,
        professor_id,
        tipo,
        referencia_id,
        trecho,
        motivos
      )
      VALUES (
        _usuario_id,
        resolved_professor_id,
        _tipo,
        _referencia_id,
        snippet,
        reasons
      );
    ELSIF has_palavras_detectadas THEN
      INSERT INTO public.conteudo_moderacao (
        usuario_id,
        tipo,
        referencia_id,
        trecho,
        motivos,
        palavras_detectadas
      )
      VALUES (
        _usuario_id,
        _tipo,
        _referencia_id,
        snippet,
        reasons,
        reasons
      );
    ELSE
      INSERT INTO public.conteudo_moderacao (
        usuario_id,
        tipo,
        referencia_id,
        trecho,
        motivos
      )
      VALUES (
        _usuario_id,
        _tipo,
        _referencia_id,
        snippet,
        reasons
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never block course/module/lesson persistence because moderation logging failed.
    RAISE NOTICE 'insert_conteudo_moderacao failed (non-blocking): %', SQLERRM;
    RETURN;
  END;

  BEGIN
    PERFORM public.insert_admin_notification(
      'moderacao_conteudo',
      'Conteudo sensivel detectado',
      COALESCE(course_title, 'Conteudo') || ' - possivel risco de moderacao.',
      jsonb_build_object(
        'tipo', _tipo,
        'referencia_id', _referencia_id,
        'curso_id', course_id,
        'curso_titulo', course_title,
        'professor_id', resolved_professor_id,
        'professor_nome', professor_name,
        'motivos', reasons,
        'trecho', snippet
      )
    );
  EXCEPTION WHEN OTHERS THEN
    -- Notification failure must not impact writes either.
    RAISE NOTICE 'insert_admin_notification failed (non-blocking): %', SQLERRM;
  END;
END;
$$;
