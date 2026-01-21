-- Moderation table for flagged content
CREATE TABLE IF NOT EXISTS public.conteudo_moderacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  referencia_id uuid,
  trecho text,
  motivos text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pendente',
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudo_moderacao
  ADD COLUMN IF NOT EXISTS usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo text,
  ADD COLUMN IF NOT EXISTS referencia_id uuid,
  ADD COLUMN IF NOT EXISTS trecho text,
  ADD COLUMN IF NOT EXISTS motivos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS criado_em timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_conteudo_moderacao_criado_em
  ON public.conteudo_moderacao (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_conteudo_moderacao_tipo
  ON public.conteudo_moderacao (tipo);

ALTER TABLE public.conteudo_moderacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver conteudo_moderacao" ON public.conteudo_moderacao;
DROP POLICY IF EXISTS "Admins podem atualizar conteudo_moderacao" ON public.conteudo_moderacao;
DROP POLICY IF EXISTS "Admins podem deletar conteudo_moderacao" ON public.conteudo_moderacao;
DROP POLICY IF EXISTS "Sistema pode inserir conteudo_moderacao" ON public.conteudo_moderacao;

CREATE POLICY "Admins podem ver conteudo_moderacao"
  ON public.conteudo_moderacao
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar conteudo_moderacao"
  ON public.conteudo_moderacao
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar conteudo_moderacao"
  ON public.conteudo_moderacao
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir conteudo_moderacao"
  ON public.conteudo_moderacao
  FOR INSERT
  WITH CHECK (true);

-- Helper to detect sensitive content
CREATE OR REPLACE FUNCTION public.detect_moderation_reasons(_text text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  reasons text[] := '{}';
BEGIN
  IF _text IS NULL OR length(trim(_text)) = 0 THEN
    RETURN reasons;
  END IF;

  IF _text ~* '(http|www\\.|\\.com|\\.br|\\.net|\\.io)' THEN
    reasons := array_append(reasons, 'link');
  END IF;

  IF _text ~* '(\\+?\\d{2}\\s?)?(\\(?\\d{2}\\)?\\s?)?\\d{4,5}[-\\s]?\\d{4}' THEN
    reasons := array_append(reasons, 'telefone');
  END IF;

  IF _text ~* '(pix|cpf|cnpj|agencia|conta|banco|cartao|credito|debito|dados bancarios)' THEN
    reasons := array_append(reasons, 'dados_sensiveis');
  END IF;

  IF _text ~* '(idiota|burro|imbecil|racista|racismo|preto\\s?sujo|fascista|nazista|merda|porra|caralho|viado|puta|vadia)' THEN
    reasons := array_append(reasons, 'ofensivo');
  END IF;

  RETURN reasons;
END;
$$;

-- Insert moderation record + notify admin
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
BEGIN
  reasons := public.detect_moderation_reasons(_conteudo);
  IF reasons IS NULL OR array_length(reasons, 1) IS NULL THEN
    RETURN;
  END IF;

  snippet := left(regexp_replace(_conteudo, '\\s+', ' ', 'g'), 220);

  INSERT INTO public.conteudo_moderacao (usuario_id, tipo, referencia_id, trecho, motivos)
  VALUES (_usuario_id, _tipo, _referencia_id, snippet, reasons);

  PERFORM public.insert_admin_notification(
    'moderacao_conteudo',
    'Conteudo sensivel detectado',
    _tipo || ' com possivel conteudo sensivel.',
    jsonb_build_object(
      'tipo', _tipo,
      'referencia_id', _referencia_id,
      'usuario_id', _usuario_id,
      'motivos', reasons,
      'trecho', snippet
    )
  );
END;
$$;

-- Ensure only admins can publish courses
CREATE OR REPLACE FUNCTION public.ensure_course_not_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ativo IS TRUE AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.ativo := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cursos_publish_guard ON public.cursos;
CREATE TRIGGER trg_cursos_publish_guard
BEFORE INSERT OR UPDATE ON public.cursos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_course_not_published();

-- Moderation triggers
CREATE OR REPLACE FUNCTION public.flag_cursos_moderacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.insert_conteudo_moderacao(
    NEW.professor_id,
    'curso',
    NEW.id,
    COALESCE(NEW.titulo, '') || ' ' || COALESCE(NEW.descricao, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cursos_moderacao ON public.cursos;
CREATE TRIGGER trg_cursos_moderacao
AFTER INSERT OR UPDATE OF titulo, descricao ON public.cursos
FOR EACH ROW
EXECUTE FUNCTION public.flag_cursos_moderacao();

CREATE OR REPLACE FUNCTION public.flag_modulos_moderacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_owner uuid;
BEGIN
  SELECT professor_id INTO course_owner FROM public.cursos WHERE id = NEW.curso_id;
  PERFORM public.insert_conteudo_moderacao(
    course_owner,
    'modulo',
    NEW.id,
    COALESCE(NEW.titulo_modulo, '') || ' ' || COALESCE(NEW.conteudo_texto_html, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_modulos_moderacao ON public.modulos;
CREATE TRIGGER trg_modulos_moderacao
AFTER INSERT OR UPDATE OF titulo_modulo, conteudo_texto_html ON public.modulos
FOR EACH ROW
EXECUTE FUNCTION public.flag_modulos_moderacao();

CREATE OR REPLACE FUNCTION public.flag_aulas_moderacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_owner uuid;
  course_id uuid;
BEGIN
  SELECT curso_id INTO course_id FROM public.modulos WHERE id = NEW.modulo_id;
  SELECT professor_id INTO course_owner FROM public.cursos WHERE id = course_id;
  PERFORM public.insert_conteudo_moderacao(
    course_owner,
    'aula',
    NEW.id,
    COALESCE(NEW.titulo, '') || ' ' || COALESCE(NEW.conteudo_html, '') || ' ' || COALESCE(NEW.video_url, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_aulas_moderacao ON public.aulas;
CREATE TRIGGER trg_aulas_moderacao
AFTER INSERT OR UPDATE OF titulo, conteudo_html, video_url ON public.aulas
FOR EACH ROW
EXECUTE FUNCTION public.flag_aulas_moderacao();
