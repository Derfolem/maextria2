-- AI plan access and payments
CREATE TABLE IF NOT EXISTS public.ai_plan_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  limit_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_payment_intent_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (usuario_id)
);

CREATE TABLE IF NOT EXISTS public.ai_plan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  amount_brl NUMERIC(10, 2) NOT NULL,
  credit_usd NUMERIC(10, 4) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'completo', 'cancelado')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, period_start)
);

ALTER TABLE public.ai_plan_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_plan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem seu plano IA"
  ON public.ai_plan_access FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins veem planos IA"
  ON public.ai_plan_access FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins atualizam planos IA"
  ON public.ai_plan_access FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam planos IA"
  ON public.ai_plan_access FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios veem seus pagamentos IA"
  ON public.ai_plan_payments FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins veem pagamentos IA"
  ON public.ai_plan_payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam pagamentos IA"
  ON public.ai_plan_payments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios veem seu consumo IA"
  ON public.ai_usage_periods FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins veem consumo IA"
  ON public.ai_usage_periods FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins deletam consumo IA"
  ON public.ai_usage_periods FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar transacoes"
  ON public.transacoes_pagamento FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
