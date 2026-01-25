-- 1. Relaxar moderação de links - permitir URLs de vídeo conhecidas
CREATE OR REPLACE FUNCTION public.detect_moderation_reasons(_text text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  reasons text[] := '{}';
  clean_text text;
BEGIN
  IF _text IS NULL OR length(trim(_text)) = 0 THEN
    RETURN reasons;
  END IF;

  -- Remove URLs de vídeo conhecidas antes de verificar links
  clean_text := regexp_replace(_text, '(https?://)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|wistia\.com|loom\.com|drive\.google\.com)[^\s]*', '', 'gi');

  -- Só flaga links se ainda houver URLs suspeitas (não de vídeo)
  IF clean_text ~* '(https?://|www\.)[^\s]+' THEN
    reasons := array_append(reasons, 'link');
  END IF;

  -- Telefone - mantém
  IF _text ~* '(\+?[0-9]{2}[[:space:]]?)?(\(?[0-9]{2}\)?[[:space:]]?)?[0-9]{4,5}[-[:space:]]?[0-9]{4}' THEN
    reasons := array_append(reasons, 'telefone');
  END IF;

  -- Dados sensíveis - mantém mas remove termos comuns em conteúdo educacional
  IF _text ~* '\b(cpf|cnpj|agencia|dados bancarios)\b' THEN
    reasons := array_append(reasons, 'dados_sensiveis');
  END IF;

  -- Ofensivo - mantém
  IF _text ~* '\b(idiota|burro|imbecil|racista|racismo|preto[[:space:]]?sujo|fascista|nazista|merda|porra|caralho|viado|puta|vadia)\b' THEN
    reasons := array_append(reasons, 'ofensivo');
  END IF;

  RETURN reasons;
END;
$$;

-- 3. Reduzir triggers - só flagar na CRIAÇÃO, não em updates

-- Curso: só INSERT
DROP TRIGGER IF EXISTS trg_cursos_moderacao ON public.cursos;
CREATE TRIGGER trg_cursos_moderacao
AFTER INSERT ON public.cursos
FOR EACH ROW
EXECUTE FUNCTION public.flag_cursos_moderacao();

-- Módulo: só INSERT
DROP TRIGGER IF EXISTS trg_modulos_moderacao ON public.modulos;
CREATE TRIGGER trg_modulos_moderacao
AFTER INSERT ON public.modulos
FOR EACH ROW
EXECUTE FUNCTION public.flag_modulos_moderacao();

-- Aula: só INSERT
DROP TRIGGER IF EXISTS trg_aulas_moderacao ON public.aulas;
CREATE TRIGGER trg_aulas_moderacao
AFTER INSERT ON public.aulas
FOR EACH ROW
EXECUTE FUNCTION public.flag_aulas_moderacao();

-- Adicionar comentários explicativos
COMMENT ON FUNCTION public.detect_moderation_reasons IS 'Detecta conteúdo sensível, ignorando URLs de plataformas de vídeo conhecidas';
