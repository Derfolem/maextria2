-- Permitir que admins vejam todos os usuários
CREATE POLICY "Admins podem ver todos usuários"
ON public.usuarios
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));