ALTER TABLE public.questionarios
  ADD COLUMN IF NOT EXISTS surpresa_slot SMALLINT,
  ADD COLUMN IF NOT EXISTS surpresa_alvo_tipo TEXT,
  ADD COLUMN IF NOT EXISTS surpresa_aula_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_questionarios_surpresa_slot
  ON public.questionarios (curso_id, surpresa_slot)
  WHERE tipo = 'surpresa' AND surpresa_slot IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questionarios_surpresa_slot_check'
  ) THEN
    ALTER TABLE public.questionarios
      ADD CONSTRAINT questionarios_surpresa_slot_check
      CHECK (
        tipo <> 'surpresa'
        OR (surpresa_slot BETWEEN 1 AND 2)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questionarios_surpresa_alvo_tipo_check'
  ) THEN
    ALTER TABLE public.questionarios
      ADD CONSTRAINT questionarios_surpresa_alvo_tipo_check
      CHECK (
        tipo <> 'surpresa'
        OR surpresa_alvo_tipo IN ('aula', 'modulo')
      );
  END IF;
END;
$$;
