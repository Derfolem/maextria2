-- Tamanhos configuraveis para imagens de certificado
ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS logo_largura_mm numeric DEFAULT 22,
  ADD COLUMN IF NOT EXISTS logo_altura_mm numeric DEFAULT 22,
  ADD COLUMN IF NOT EXISTS assinatura_largura_mm numeric DEFAULT 38,
  ADD COLUMN IF NOT EXISTS assinatura_altura_mm numeric DEFAULT 14;
