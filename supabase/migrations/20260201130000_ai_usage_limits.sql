-- AI usage tracking and limits
CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  total_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, month)
);

CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  limit_usd NUMERIC(10, 4) NOT NULL DEFAULT 5,
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (usuario_id)
);

ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios veem proprio consumo IA"
  ON public.ai_usage_monthly FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Admins veem consumo IA"
  ON public.ai_usage_monthly FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins gerenciam limites IA"
  ON public.ai_usage_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.configuracoes_site (chave, valor, descricao)
VALUES ('ai_monthly_limit_usd', '5', 'Limite mensal em USD por professor')
ON CONFLICT (chave) DO NOTHING;
