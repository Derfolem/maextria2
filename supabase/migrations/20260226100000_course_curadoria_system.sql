-- Migration: Sistema de Curadoria de Cursos
-- Adiciona campos para controle de curadoria e feedback entre professor e admin

-- Adicionar campo em_curadoria (indica se o curso está em revisão pelo admin)
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS em_curadoria BOOLEAN DEFAULT FALSE;

-- Adicionar campo feedback_curadoria (mensagem de reprovação do admin)
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS feedback_curadoria TEXT;

-- Comentários para documentação
COMMENT ON COLUMN cursos.em_curadoria IS 'Indica se o curso está em processo de curadoria pelo admin. Quando true, professor não pode editar.';
COMMENT ON COLUMN cursos.feedback_curadoria IS 'Mensagem de feedback do admin quando reprova o curso. Limpa quando professor reenvia para curadoria.';
