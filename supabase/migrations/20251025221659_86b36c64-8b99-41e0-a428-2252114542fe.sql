-- Add certificate price column to courses table
ALTER TABLE public.cursos 
ADD COLUMN preco_certificado DECIMAL(10,2) DEFAULT 39.00;

COMMENT ON COLUMN public.cursos.preco_certificado IS 'Preço do certificado em reais';