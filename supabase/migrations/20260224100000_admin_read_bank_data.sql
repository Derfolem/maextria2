-- Permite que admins leiam dados bancarios dos professores para fazer repasses
CREATE POLICY "Admin le dados bancarios dos professores"
  ON public.professor_dados_bancarios FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
