-- Allow permanent deletions of internal messages
DROP POLICY IF EXISTS "Usuarios podem deletar mensagens internas" ON public.internal_messages;
CREATE POLICY "Usuarios podem deletar mensagens internas"
  ON public.internal_messages
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR sender_id = auth.uid()
  );
