-- Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função de verificação segura de roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policy para usuários verem apenas seus próprios roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- CURSOS: Admin pode INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert courses"
  ON public.cursos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update courses"
  ON public.cursos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete courses"
  ON public.cursos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- MÓDULOS: Admin pode INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert modules"
  ON public.modulos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update modules"
  ON public.modulos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete modules"
  ON public.modulos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- PROVA_QUESTOES: Admin pode INSERT/UPDATE/DELETE
CREATE POLICY "Admins can insert questions"
  ON public.prova_questoes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
  ON public.prova_questoes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
  ON public.prova_questoes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- CERTIFICADOS: Admin pode ver todos e criar
CREATE POLICY "Admins can view all certificates"
  ON public.certificados FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert certificates"
  ON public.certificados FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificates"
  ON public.certificados FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));