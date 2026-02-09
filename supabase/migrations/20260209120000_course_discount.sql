-- Add percentage discount for certificate price on courses
ALTER TABLE public.cursos
  ADD COLUMN IF NOT EXISTS desconto_percentual numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cursos_desconto_percentual_check'
  ) THEN
    ALTER TABLE public.cursos
      ADD CONSTRAINT cursos_desconto_percentual_check
      CHECK (desconto_percentual >= 0 AND desconto_percentual <= 100);
  END IF;
END $$;

COMMENT ON COLUMN public.cursos.desconto_percentual IS 'Percentual de desconto aplicado ao preco do certificado (0-100).';
