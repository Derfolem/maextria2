-- Add author fields to cursos if missing
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS professor_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS professor_nome TEXT;

-- Table for course suggestions
CREATE TABLE IF NOT EXISTS public.curso_sugestoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso TEXT NOT NULL,
  motivo TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.curso_sugestoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem inserir sugestoes"
  ON public.curso_sugestoes
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins podem ver sugestoes"
  ON public.curso_sugestoes
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin notifications table
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_criado_em
  ON public.admin_notifications (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_tipo
  ON public.admin_notifications (tipo);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver notificacoes"
  ON public.admin_notifications
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Helper to insert notification and cleanup old rows
CREATE OR REPLACE FUNCTION public.insert_admin_notification(
  _tipo TEXT,
  _titulo TEXT,
  _descricao TEXT,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (tipo, titulo, descricao, metadata)
  VALUES (_tipo, _titulo, _descricao, COALESCE(_metadata, '{}'::jsonb));

  DELETE FROM public.admin_notifications
  WHERE criado_em < now() - interval '30 days';
END;
$$;

-- Notifications: new user registration
CREATE OR REPLACE FUNCTION public.notify_user_registered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  SELECT
    COALESCE(u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email),
    COALESCE(u.email, au.email)
  INTO user_name, user_email
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.id
  WHERE au.id = NEW.id;

  user_name := COALESCE(user_name, 'Novo usuario');
  user_email := COALESCE(user_email, '');

  PERFORM public.insert_admin_notification(
    'user_registered',
    'Novo cadastro',
    user_name || ' se cadastrou (' || user_email || ')',
    jsonb_build_object('usuario_id', NEW.id, 'nome', user_name, 'email', user_email)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_user_registered ON public.usuarios;
CREATE TRIGGER trg_notify_user_registered
AFTER INSERT ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.notify_user_registered();

-- Notifications: new enrollment
CREATE OR REPLACE FUNCTION public.notify_enrollment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
  course_title TEXT;
BEGIN
  SELECT
    COALESCE(u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email),
    COALESCE(u.email, au.email)
  INTO user_name, user_email
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.usuario_id
  WHERE au.id = NEW.usuario_id;

  SELECT titulo INTO course_title FROM public.cursos WHERE id = NEW.curso_id;

  user_name := COALESCE(user_name, 'Aluno');
  user_email := COALESCE(user_email, '');
  course_title := COALESCE(course_title, 'curso');

  PERFORM public.insert_admin_notification(
    'enrollment',
    'Nova matricula',
    user_name || ' se matriculou em "' || course_title || '"',
    jsonb_build_object('usuario_id', NEW.usuario_id, 'curso_id', NEW.curso_id, 'nome', user_name, 'email', user_email, 'curso', course_title)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_enrollment_created ON public.matriculas;
CREATE TRIGGER trg_notify_enrollment_created
AFTER INSERT ON public.matriculas
FOR EACH ROW
EXECUTE FUNCTION public.notify_enrollment_created();

-- Notifications: new course created
CREATE OR REPLACE FUNCTION public.notify_course_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_name TEXT;
BEGIN
  SELECT
    COALESCE(NEW.professor_nome, u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email)
  INTO teacher_name
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.professor_id
  WHERE au.id = NEW.professor_id;

  teacher_name := COALESCE(teacher_name, 'Professor');

  PERFORM public.insert_admin_notification(
    'course_created',
    'Novo curso criado',
    teacher_name || ' publicou "' || NEW.titulo || '"',
    jsonb_build_object('curso_id', NEW.id, 'curso', NEW.titulo, 'professor_id', NEW.professor_id, 'professor', teacher_name)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_course_created ON public.cursos;
CREATE TRIGGER trg_notify_course_created
AFTER INSERT ON public.cursos
FOR EACH ROW
EXECUTE FUNCTION public.notify_course_created();

-- Notifications: certificate purchase (paid)
CREATE OR REPLACE FUNCTION public.notify_certificate_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged BOOLEAN;
  user_name TEXT;
  user_email TEXT;
  course_title TEXT;
  course_price NUMERIC;
BEGIN
  IF NEW.pago IS NOT TRUE OR (TG_OP = 'UPDATE' AND OLD.pago IS TRUE) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.usuario_id
      AND role IN ('admin', 'teacher')
  ) INTO is_privileged;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email),
    COALESCE(u.email, au.email)
  INTO user_name, user_email
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.usuario_id
  WHERE au.id = NEW.usuario_id;

  SELECT titulo, preco_certificado
  INTO course_title, course_price
  FROM public.cursos
  WHERE id = NEW.curso_id;

  user_name := COALESCE(user_name, 'Aluno');
  user_email := COALESCE(user_email, '');
  course_title := COALESCE(course_title, 'curso');
  course_price := COALESCE(course_price, 0);

  PERFORM public.insert_admin_notification(
    'certificate_purchased',
    'Certificado comprado',
    user_name || ' comprou o certificado de "' || course_title || '" por R$ ' || to_char(course_price, 'FM999G999D00'),
    jsonb_build_object('usuario_id', NEW.usuario_id, 'curso_id', NEW.curso_id, 'nome', user_name, 'email', user_email, 'curso', course_title, 'valor', course_price)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_certificate_paid ON public.certificados;
CREATE TRIGGER trg_notify_certificate_paid
AFTER INSERT OR UPDATE ON public.certificados
FOR EACH ROW
EXECUTE FUNCTION public.notify_certificate_paid();

-- Notifications: certificate issued
CREATE OR REPLACE FUNCTION public.notify_certificate_issued()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_privileged BOOLEAN;
  user_name TEXT;
  user_email TEXT;
  course_title TEXT;
BEGIN
  IF NEW.emitido_em IS NULL OR (TG_OP = 'UPDATE' AND OLD.emitido_em IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.usuario_id
      AND role IN ('admin', 'teacher')
  ) INTO is_privileged;

  IF is_privileged THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email),
    COALESCE(u.email, au.email)
  INTO user_name, user_email
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.usuario_id
  WHERE au.id = NEW.usuario_id;

  SELECT titulo INTO course_title FROM public.cursos WHERE id = NEW.curso_id;

  user_name := COALESCE(user_name, 'Aluno');
  user_email := COALESCE(user_email, '');
  course_title := COALESCE(course_title, 'curso');

  PERFORM public.insert_admin_notification(
    'certificate_issued',
    'Certificado emitido',
    user_name || ' emitiu o certificado de "' || course_title || '"',
    jsonb_build_object('usuario_id', NEW.usuario_id, 'curso_id', NEW.curso_id, 'nome', user_name, 'email', user_email, 'curso', course_title)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_certificate_issued ON public.certificados;
CREATE TRIGGER trg_notify_certificate_issued
AFTER INSERT OR UPDATE ON public.certificados
FOR EACH ROW
EXECUTE FUNCTION public.notify_certificate_issued();

-- Notifications: course suggestion
CREATE OR REPLACE FUNCTION public.notify_course_suggestion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  SELECT
    COALESCE(u.nome_completo, au.raw_user_meta_data->>'nome_completo', au.email),
    COALESCE(u.email, au.email)
  INTO user_name, user_email
  FROM auth.users au
  LEFT JOIN public.usuarios u ON u.id = NEW.usuario_id
  WHERE au.id = NEW.usuario_id;

  user_name := COALESCE(user_name, 'Aluno');
  user_email := COALESCE(user_email, '');

  PERFORM public.insert_admin_notification(
    'course_suggestion',
    'Sugestao de curso',
    user_name || ' sugeriu o curso "' || NEW.curso || '"',
    jsonb_build_object('usuario_id', NEW.usuario_id, 'nome', user_name, 'email', user_email, 'curso', NEW.curso, 'motivo', NEW.motivo)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_course_suggestion ON public.curso_sugestoes;
CREATE TRIGGER trg_notify_course_suggestion
AFTER INSERT ON public.curso_sugestoes
FOR EACH ROW
EXECUTE FUNCTION public.notify_course_suggestion();
