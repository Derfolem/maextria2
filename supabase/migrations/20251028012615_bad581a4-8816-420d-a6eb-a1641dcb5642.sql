-- Add index to improve performance on cursos query
CREATE INDEX IF NOT EXISTS idx_cursos_ativo_criado ON public.cursos(ativo, criado_em DESC) WHERE ativo = true;

-- Add index to improve avaliacoes query performance
CREATE INDEX IF NOT EXISTS idx_avaliacoes_curso_id ON public.avaliacoes(curso_id);

-- Add index to improve colaboradores lookup
CREATE INDEX IF NOT EXISTS idx_colaboradores_usuario_ativo ON public.colaboradores(usuario_id, ativo) WHERE ativo = true;