-- Create table for credit cards (storing tokenized data only, never full card numbers)
CREATE TABLE public.cartoes_credito (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ultimos_digitos TEXT NOT NULL, -- Only last 4 digits
  bandeira TEXT NOT NULL, -- visa, mastercard, etc
  nome_titular TEXT NOT NULL,
  token_gateway TEXT, -- Token from payment gateway
  padrao BOOLEAN DEFAULT false,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT ultimos_digitos_check CHECK (length(ultimos_digitos) = 4)
);

-- Enable RLS
ALTER TABLE public.cartoes_credito ENABLE ROW LEVEL SECURITY;

-- Users can view their own cards
CREATE POLICY "Usuários veem próprios cartões"
ON public.cartoes_credito
FOR SELECT
USING (auth.uid() = usuario_id);

-- Users can insert their own cards
CREATE POLICY "Usuários podem cadastrar próprios cartões"
ON public.cartoes_credito
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Users can update their own cards
CREATE POLICY "Usuários podem atualizar próprios cartões"
ON public.cartoes_credito
FOR UPDATE
USING (auth.uid() = usuario_id);

-- Users can delete their own cards
CREATE POLICY "Usuários podem deletar próprios cartões"
ON public.cartoes_credito
FOR DELETE
USING (auth.uid() = usuario_id);

-- Admins can view all cards
CREATE POLICY "Admins podem ver todos cartões"
ON public.cartoes_credito
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_cartoes_usuario ON public.cartoes_credito(usuario_id);