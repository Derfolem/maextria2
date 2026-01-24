-- Adiciona campo de chave PIX aos dados bancarios
ALTER TABLE public.professor_dados_bancarios
ADD COLUMN IF NOT EXISTS chave_pix text;

-- Adiciona comentario explicativo
COMMENT ON COLUMN public.professor_dados_bancarios.chave_pix IS 'Chave PIX do professor (CPF, email, telefone ou aleatoria)';
