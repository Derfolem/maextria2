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
BEGIN
  reasons := public.detect_moderation_reasons(_conteudo);
  IF reasons IS NULL OR array_length(reasons, 1) IS NULL THEN
    RETURN;
  END IF;

  snippet := left(regexp_replace(_conteudo, '\\s+', ' ', 'g'), 220);

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

  INSERT INTO public.conteudo_moderacao (usuario_id, tipo, referencia_id, trecho, motivos)
  VALUES (_usuario_id, _tipo, _referencia_id, snippet, reasons);

  PERFORM public.insert_admin_notification(
    'moderacao_conteudo',
    'Conteudo sensivel detectado',
    COALESCE(course_title, 'Conteudo') || ' - possivel risco de moderacao.',
    jsonb_build_object(
      'tipo', _tipo,
      'referencia_id', _referencia_id,
      'curso_id', course_id,
      'curso_titulo', course_title,
      'professor_id', professor_id,
      'professor_nome', professor_name,
      'motivos', reasons,
      'trecho', snippet
    )
  );
END;
$$;
