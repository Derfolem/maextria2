-- Fix: Drop existing policies before recreating
-- Run this if you get "policy already exists" errors

-- Drop policies for curriculos
DROP POLICY IF EXISTS "Usuarios veem seu curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem criar curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem atualizar curriculo" ON public.curriculos;
DROP POLICY IF EXISTS "Usuarios podem deletar curriculo" ON public.curriculos;

-- Drop policies for curriculo_formacao
DROP POLICY IF EXISTS "Usuarios veem sua formacao" ON public.curriculo_formacao;
DROP POLICY IF EXISTS "Usuarios podem criar formacao" ON public.curriculo_formacao;
DROP POLICY IF EXISTS "Usuarios podem atualizar formacao" ON public.curriculo_formacao;
DROP POLICY IF EXISTS "Usuarios podem deletar formacao" ON public.curriculo_formacao;

-- Drop policies for curriculo_experiencia
DROP POLICY IF EXISTS "Usuarios veem sua experiencia" ON public.curriculo_experiencia;
DROP POLICY IF EXISTS "Usuarios podem criar experiencia" ON public.curriculo_experiencia;
DROP POLICY IF EXISTS "Usuarios podem atualizar experiencia" ON public.curriculo_experiencia;
DROP POLICY IF EXISTS "Usuarios podem deletar experiencia" ON public.curriculo_experiencia;

-- Drop policies for curriculo_certificados_externos
DROP POLICY IF EXISTS "Usuarios veem seus certs externos" ON public.curriculo_certificados_externos;
DROP POLICY IF EXISTS "Usuarios podem criar certs externos" ON public.curriculo_certificados_externos;
DROP POLICY IF EXISTS "Usuarios podem atualizar certs externos" ON public.curriculo_certificados_externos;
DROP POLICY IF EXISTS "Usuarios podem deletar certs externos" ON public.curriculo_certificados_externos;

-- Drop policies for curriculo_habilidades
DROP POLICY IF EXISTS "Usuarios veem suas habilidades" ON public.curriculo_habilidades;
DROP POLICY IF EXISTS "Usuarios podem criar habilidades" ON public.curriculo_habilidades;
DROP POLICY IF EXISTS "Usuarios podem atualizar habilidades" ON public.curriculo_habilidades;
DROP POLICY IF EXISTS "Usuarios podem deletar habilidades" ON public.curriculo_habilidades;

-- Drop policies for curriculo_idiomas
DROP POLICY IF EXISTS "Usuarios veem seus idiomas" ON public.curriculo_idiomas;
DROP POLICY IF EXISTS "Usuarios podem criar idiomas" ON public.curriculo_idiomas;
DROP POLICY IF EXISTS "Usuarios podem atualizar idiomas" ON public.curriculo_idiomas;
DROP POLICY IF EXISTS "Usuarios podem deletar idiomas" ON public.curriculo_idiomas;

-- Now recreate all policies

-- curriculos
CREATE POLICY "Usuarios veem seu curriculo"
  ON public.curriculos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar curriculo"
  ON public.curriculos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar curriculo"
  ON public.curriculos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar curriculo"
  ON public.curriculos FOR DELETE
  USING (auth.uid() = usuario_id);

-- curriculo_formacao
CREATE POLICY "Usuarios veem sua formacao"
  ON public.curriculo_formacao FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar formacao"
  ON public.curriculo_formacao FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar formacao"
  ON public.curriculo_formacao FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar formacao"
  ON public.curriculo_formacao FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- curriculo_experiencia
CREATE POLICY "Usuarios veem sua experiencia"
  ON public.curriculo_experiencia FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar experiencia"
  ON public.curriculo_experiencia FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar experiencia"
  ON public.curriculo_experiencia FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar experiencia"
  ON public.curriculo_experiencia FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- curriculo_certificados_externos
CREATE POLICY "Usuarios veem seus certs externos"
  ON public.curriculo_certificados_externos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar certs externos"
  ON public.curriculo_certificados_externos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar certs externos"
  ON public.curriculo_certificados_externos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar certs externos"
  ON public.curriculo_certificados_externos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- curriculo_habilidades
CREATE POLICY "Usuarios veem suas habilidades"
  ON public.curriculo_habilidades FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar habilidades"
  ON public.curriculo_habilidades FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar habilidades"
  ON public.curriculo_habilidades FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar habilidades"
  ON public.curriculo_habilidades FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

-- curriculo_idiomas
CREATE POLICY "Usuarios veem seus idiomas"
  ON public.curriculo_idiomas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem criar idiomas"
  ON public.curriculo_idiomas FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem atualizar idiomas"
  ON public.curriculo_idiomas FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));

CREATE POLICY "Usuarios podem deletar idiomas"
  ON public.curriculo_idiomas FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.curriculos c
    WHERE c.id = curriculo_id AND c.usuario_id = auth.uid()
  ));
