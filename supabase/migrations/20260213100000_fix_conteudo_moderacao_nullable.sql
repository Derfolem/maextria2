-- Fix conteudo_moderacao table to allow null in conteudo_texto or set default
-- This fixes the error: null value in column "conteudo_texto" violates not-null constraint

-- Add conteudo_texto column if it doesn't exist and allow NULL
ALTER TABLE public.conteudo_moderacao
  ADD COLUMN IF NOT EXISTS conteudo_texto text;

-- If column exists but has NOT NULL constraint, drop it
ALTER TABLE public.conteudo_moderacao
  ALTER COLUMN conteudo_texto DROP NOT NULL;

-- Update the insert function to include conteudo_texto
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
BEGIN
  reasons := public.detect_moderation_reasons(_conteudo);
  IF reasons IS NULL OR array_length(reasons, 1) IS NULL THEN
    RETURN;
  END IF;

  snippet := left(regexp_replace(_conteudo, '[[:space:]]+', ' ', 'g'), 220);

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
  IF resolved_professor_id IS NULL THEN
    RETURN;
  END IF;

  -- Insert with conteudo_texto included
  INSERT INTO public.conteudo_moderacao (
    usuario_id,
    professor_id,
    tipo,
    referencia_id,
    trecho,
    conteudo_texto,
    motivos
  )
  VALUES (
    _usuario_id,
    resolved_professor_id,
    _tipo,
    _referencia_id,
    snippet,
    _conteudo,  -- Include full content
    reasons
  );

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
END;
$$;
