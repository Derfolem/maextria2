-- Criar tabela de matrículas
CREATE TABLE public.matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  data_matricula TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativa BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(usuario_id, curso_id)
);

-- Enable Row Level Security
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para matriculas
CREATE POLICY "Usuários podem ver próprias matrículas"
ON public.matriculas
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar próprias matrículas"
ON public.matriculas
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprias matrículas"
ON public.matriculas
FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Admins podem ver todas matrículas"
ON public.matriculas
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar matrículas"
ON public.matriculas
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Criar índices para melhor performance
CREATE INDEX idx_matriculas_usuario_id ON public.matriculas(usuario_id);
CREATE INDEX idx_matriculas_curso_id ON public.matriculas(curso_id);

-- Adicionar campo categoria aos cursos
ALTER TABLE public.cursos ADD COLUMN IF NOT EXISTS categoria TEXT;