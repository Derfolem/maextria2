ALTER TABLE public.transacoes_pagamento
  ADD COLUMN IF NOT EXISTS mercado_pago_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mercado_pago_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mercado_pago_status TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code TEXT,
  ADD COLUMN IF NOT EXISTS pix_qr_code_base64 TEXT,
  ADD COLUMN IF NOT EXISTS pix_copia_e_cola TEXT,
  ADD COLUMN IF NOT EXISTS pix_ticket_url TEXT;

CREATE INDEX IF NOT EXISTS idx_transacoes_mp_payment_id
  ON public.transacoes_pagamento(mercado_pago_payment_id);
