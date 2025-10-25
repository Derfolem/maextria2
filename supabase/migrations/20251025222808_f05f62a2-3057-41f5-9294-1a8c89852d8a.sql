-- Create table for payment transactions log
CREATE TABLE public.transacoes_pagamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  certificado_id UUID REFERENCES public.certificados(id) ON DELETE SET NULL,
  valor DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'completo', 'cancelado', 'reembolsado')),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  metodo_pagamento TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transacoes_pagamento ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Usuários veem próprias transações"
ON public.transacoes_pagamento
FOR SELECT
USING (auth.uid() = usuario_id);

-- Admins can view all transactions
CREATE POLICY "Admins podem ver todas transações"
ON public.transacoes_pagamento
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert transactions (via edge functions)
CREATE POLICY "Sistema pode inserir transações"
ON public.transacoes_pagamento
FOR INSERT
WITH CHECK (true);

-- System can update transactions
CREATE POLICY "Sistema pode atualizar transações"
ON public.transacoes_pagamento
FOR UPDATE
USING (true);

-- Create indexes for performance
CREATE INDEX idx_transacoes_usuario ON public.transacoes_pagamento(usuario_id);
CREATE INDEX idx_transacoes_curso ON public.transacoes_pagamento(curso_id);
CREATE INDEX idx_transacoes_status ON public.transacoes_pagamento(status);
CREATE INDEX idx_transacoes_criado ON public.transacoes_pagamento(criado_em DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transacoes_timestamp
BEFORE UPDATE ON public.transacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.update_avaliacoes_updated_at();

-- Create view for admin reports
CREATE OR REPLACE VIEW public.relatorio_vendas AS
SELECT 
  DATE_TRUNC('day', tp.criado_em) as data,
  COUNT(*) as total_vendas,
  SUM(tp.valor) as receita_total,
  c.titulo as curso_titulo,
  c.id as curso_id
FROM public.transacoes_pagamento tp
INNER JOIN public.cursos c ON tp.curso_id = c.id
WHERE tp.status = 'completo'
GROUP BY DATE_TRUNC('day', tp.criado_em), c.titulo, c.id
ORDER BY data DESC;

-- Grant access to the view
GRANT SELECT ON public.relatorio_vendas TO authenticated;

COMMENT ON TABLE public.transacoes_pagamento IS 'Registro de todas as transações de pagamento';
COMMENT ON VIEW public.relatorio_vendas IS 'Relatório consolidado de vendas para administradores';