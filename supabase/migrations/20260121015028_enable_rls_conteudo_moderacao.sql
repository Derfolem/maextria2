-- Enable RLS on conteudo_moderacao table
ALTER TABLE public.conteudo_moderacao ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all moderation content
CREATE POLICY "Admins podem ver conteudo_moderacao"
ON public.conteudo_moderacao
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.tipo = 'admin'
  )
);

-- Policy: Admins can update moderation status
CREATE POLICY "Admins podem atualizar conteudo_moderacao"
ON public.conteudo_moderacao
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.tipo = 'admin'
  )
);

-- Policy: System/service can insert moderation records
CREATE POLICY "Sistema pode inserir conteudo_moderacao"
ON public.conteudo_moderacao
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Admins can delete moderation records
CREATE POLICY "Admins podem deletar conteudo_moderacao"
ON public.conteudo_moderacao
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE usuarios.id = auth.uid() 
    AND usuarios.tipo = 'admin'
  )
);
