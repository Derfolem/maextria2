-- Permite que admins deletem notificações
CREATE POLICY "Admins podem deletar notificacoes"
  ON public.admin_notifications
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
