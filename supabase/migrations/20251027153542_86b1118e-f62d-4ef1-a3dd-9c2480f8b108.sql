-- Criar tabela de mensagens internas
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  remetente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  remetente_nome TEXT,
  remetente_email TEXT NOT NULL,
  destinatario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assunto TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'nao_lida' CHECK (status IN ('nao_lida', 'lida', 'respondida')),
  resposta TEXT,
  respondida_em TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as mensagens
CREATE POLICY "Admins podem ver todas mensagens"
ON public.mensagens
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins podem atualizar mensagens (responder)
CREATE POLICY "Admins podem atualizar mensagens"
ON public.mensagens
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver suas próprias mensagens
CREATE POLICY "Usuários veem próprias mensagens"
ON public.mensagens
FOR SELECT
USING (auth.uid() = remetente_id OR auth.uid() = destinatario_id);

-- Qualquer um pode inserir mensagem (incluindo não autenticados via edge function)
CREATE POLICY "Sistema pode inserir mensagens"
ON public.mensagens
FOR INSERT
WITH CHECK (true);

-- Adicionar coluna de status bloqueado na tabela usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;