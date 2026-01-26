-- Migration: Sistema de Avaliação de Aulas
-- Adiciona rating por aula e rating médio por curso

-- 1. Adicionar campo rating na tabela progresso_aula
ALTER TABLE public.progresso_aula
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- 2. Adicionar campo rating_medio na tabela cursos (default 4.3 para cursos novos)
ALTER TABLE public.cursos
ADD COLUMN IF NOT EXISTS rating_medio REAL DEFAULT 4.3;

-- 3. Criar índice para performance nas consultas de rating
CREATE INDEX IF NOT EXISTS idx_progresso_aula_rating
ON public.progresso_aula(aula_id)
WHERE rating IS NOT NULL;

-- 4. Função para recalcular rating médio do curso
CREATE OR REPLACE FUNCTION public.recalcular_rating_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_curso_id UUID;
  v_media REAL;
BEGIN
  -- Buscar o curso_id através da aula -> modulo -> curso
  SELECT m.curso_id INTO v_curso_id
  FROM public.aulas a
  JOIN public.modulos m ON a.modulo_id = m.id
  WHERE a.id = NEW.aula_id;

  -- Se não encontrou o curso, retorna sem fazer nada
  IF v_curso_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calcular média de todas as avaliações de aulas do curso
  SELECT COALESCE(AVG(pa.rating)::REAL, 4.3) INTO v_media
  FROM public.progresso_aula pa
  JOIN public.aulas a ON pa.aula_id = a.id
  JOIN public.modulos m ON a.modulo_id = m.id
  WHERE m.curso_id = v_curso_id
    AND pa.rating IS NOT NULL;

  -- Atualizar rating_medio do curso
  UPDATE public.cursos
  SET rating_medio = v_media
  WHERE id = v_curso_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Dropar trigger se existir (para permitir reexecução da migration)
DROP TRIGGER IF EXISTS trigger_recalcular_rating_curso ON public.progresso_aula;

-- 6. Criar trigger para recalcular rating após INSERT ou UPDATE
CREATE TRIGGER trigger_recalcular_rating_curso
AFTER INSERT OR UPDATE OF rating ON public.progresso_aula
FOR EACH ROW
WHEN (NEW.rating IS NOT NULL)
EXECUTE FUNCTION public.recalcular_rating_curso();

-- 7. Comentários para documentação
COMMENT ON COLUMN public.progresso_aula.rating IS 'Avaliação de 1-5 estrelas dada pelo aluno para a aula';
COMMENT ON COLUMN public.cursos.rating_medio IS 'Média das avaliações de todas as aulas do curso (default: 4.3)';
