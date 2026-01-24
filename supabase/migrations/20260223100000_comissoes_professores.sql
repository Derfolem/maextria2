-- Tabela de comissões dos professores
CREATE TABLE IF NOT EXISTS public.comissoes_professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  certificado_id uuid REFERENCES public.certificados(id) ON DELETE SET NULL,
  transacao_id uuid REFERENCES public.transacoes_pagamento(id) ON DELETE SET NULL,
  valor_venda numeric(10,2) NOT NULL,
  percentual_professor numeric(5,2) NOT NULL,
  valor_comissao numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
  data_pagamento timestamptz,
  observacoes text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_comissoes_professor ON public.comissoes_professores(professor_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_status ON public.comissoes_professores(status);
CREATE INDEX IF NOT EXISTS idx_comissoes_criado_em ON public.comissoes_professores(criado_em);

-- Habilitar RLS
ALTER TABLE public.comissoes_professores ENABLE ROW LEVEL SECURITY;

-- Professores veem suas proprias comissoes
CREATE POLICY "Professores veem proprias comissoes"
  ON public.comissoes_professores FOR SELECT
  USING (auth.uid() = professor_id);

-- Admins veem todas as comissoes
CREATE POLICY "Admins veem todas comissoes"
  ON public.comissoes_professores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins atualizam comissoes (para marcar como pago)
CREATE POLICY "Admins atualizam comissoes"
  ON public.comissoes_professores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Sistema pode inserir comissoes (via service role nas edge functions)
CREATE POLICY "Sistema insere comissoes"
  ON public.comissoes_professores FOR INSERT
  WITH CHECK (true);

-- View para relatorio de comissoes por professor
CREATE OR REPLACE VIEW public.relatorio_comissoes_professor AS
SELECT
  cp.professor_id,
  u.nome_completo as professor_nome,
  u.email as professor_email,
  COUNT(*) FILTER (WHERE cp.status = 'pendente') as total_pendentes,
  COUNT(*) FILTER (WHERE cp.status = 'pago') as total_pagas,
  COALESCE(SUM(cp.valor_comissao) FILTER (WHERE cp.status = 'pendente'), 0) as valor_pendente,
  COALESCE(SUM(cp.valor_comissao) FILTER (WHERE cp.status = 'pago'), 0) as valor_pago,
  COALESCE(SUM(cp.valor_comissao), 0) as valor_total
FROM public.comissoes_professores cp
JOIN public.usuarios u ON u.id = cp.professor_id
GROUP BY cp.professor_id, u.nome_completo, u.email;

-- Funcao para atualizar updated_at
CREATE OR REPLACE FUNCTION update_comissao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comissoes_updated_at
  BEFORE UPDATE ON public.comissoes_professores
  FOR EACH ROW EXECUTE FUNCTION update_comissao_updated_at();
