-- Adiciona 'surpresa' aos valores permitidos no campo tipo de questionarios
ALTER TABLE public.questionarios
  DROP CONSTRAINT IF EXISTS questionarios_tipo_check;

ALTER TABLE public.questionarios
  ADD CONSTRAINT questionarios_tipo_check
  CHECK (tipo IN ('modulo', 'final', 'surpresa'));
