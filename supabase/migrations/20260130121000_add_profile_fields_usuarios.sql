ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS endereco text;
