-- Migration: Course Versioning System
-- Permite que professores editem cursos publicados criando novas versões
-- Alunos existentes permanecem na versão em que se matricularam

-- ============================================
-- 1. Novos campos na tabela cursos
-- ============================================

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS curso_original_id UUID REFERENCES cursos(id) ON DELETE SET NULL;
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;

-- Índice para buscar versões de um curso
CREATE INDEX IF NOT EXISTS idx_cursos_original_id ON cursos(curso_original_id);

-- Comentários para documentação
COMMENT ON COLUMN cursos.curso_original_id IS 'Referência ao curso original. NULL = curso original. Preenchido = clone/nova versão.';
COMMENT ON COLUMN cursos.versao IS 'Número da versão do curso. 1 = original, 2+ = versões subsequentes.';

-- ============================================
-- 2. Função: should_clone_for_editing
-- Verifica se o curso precisa ser clonado para edição
-- ============================================

CREATE OR REPLACE FUNCTION public.should_clone_for_editing(p_curso_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_published boolean;
  v_has_enrollments boolean;
BEGIN
  -- Verificar se está publicado
  SELECT ativo INTO v_is_published FROM cursos WHERE id = p_curso_id;

  -- Verificar se tem matrículas
  SELECT EXISTS (
    SELECT 1 FROM matriculas WHERE curso_id = p_curso_id LIMIT 1
  ) INTO v_has_enrollments;

  -- Clone obrigatório se: publicado E tem alunos
  RETURN COALESCE(v_is_published, false) AND COALESCE(v_has_enrollments, false);
END;
$$;

-- ============================================
-- 3. Função: get_pending_clone
-- Retorna ID de clone existente não-publicado (evita duplicados)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_pending_clone(p_original_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_root_id uuid;
  v_pending_clone uuid;
BEGIN
  -- Encontrar o curso raiz (original)
  SELECT COALESCE(curso_original_id, id) INTO v_root_id
  FROM cursos WHERE id = p_original_id;

  -- Buscar clone pendente (não publicado) do mesmo professor
  SELECT id INTO v_pending_clone
  FROM cursos
  WHERE curso_original_id = v_root_id
    AND ativo = false
    AND em_curadoria = false
    AND professor_id = auth.uid()
  ORDER BY criado_em DESC
  LIMIT 1;

  RETURN v_pending_clone;
END;
$$;

-- ============================================
-- 4. Função: clone_course_for_editing
-- Cria clone completo do curso para edição
-- ============================================

CREATE OR REPLACE FUNCTION public.clone_course_for_editing(p_original_curso_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_course_id uuid;
  v_new_slug text;
  v_next_version integer;
  v_root_id uuid;
  v_module_map jsonb := '{}';
  v_new_module_id uuid;
  v_new_quiz_id uuid;
  v_aula_map jsonb := '{}';
  v_new_aula_id uuid;
  rec RECORD;
  aula_rec RECORD;
BEGIN
  -- Verificar permissão: apenas o professor dono pode clonar
  IF NOT EXISTS (
    SELECT 1 FROM cursos
    WHERE id = p_original_curso_id
    AND professor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Não autorizado: você não é o professor deste curso';
  END IF;

  -- Determinar o curso raiz (original da árvore de versões)
  SELECT COALESCE(curso_original_id, id) INTO v_root_id
  FROM cursos WHERE id = p_original_curso_id;

  -- Calcular próxima versão
  SELECT COALESCE(MAX(versao), 0) + 1 INTO v_next_version
  FROM cursos WHERE curso_original_id = v_root_id OR id = v_root_id;

  -- Gerar novo slug único
  v_new_slug := (SELECT slug FROM cursos WHERE id = p_original_curso_id)
                || '-v' || v_next_version;

  -- ========== CLONAR CURSO ==========
  INSERT INTO cursos (
    titulo, descricao, slug, categoria, nivel, carga_horaria_horas,
    imagem_capa_url, preco_certificado, professor_id, professor_nome,
    ativo, em_curadoria, feedback_curadoria, curso_original_id, versao
  )
  SELECT
    titulo, descricao, v_new_slug, categoria, nivel, carga_horaria_horas,
    imagem_capa_url, preco_certificado, professor_id, professor_nome,
    false, false, null, v_root_id, v_next_version
  FROM cursos WHERE id = p_original_curso_id
  RETURNING id INTO v_new_course_id;

  -- ========== CLONAR MÓDULOS ==========
  FOR rec IN SELECT * FROM modulos WHERE curso_id = p_original_curso_id ORDER BY ordem
  LOOP
    INSERT INTO modulos (curso_id, titulo_modulo, conteudo_texto_html, ordem)
    VALUES (v_new_course_id, rec.titulo_modulo, rec.conteudo_texto_html, rec.ordem)
    RETURNING id INTO v_new_module_id;

    -- Mapear ID antigo -> novo
    v_module_map := v_module_map || jsonb_build_object(rec.id::text, v_new_module_id::text);

    -- ========== CLONAR AULAS DO MÓDULO ==========
    FOR aula_rec IN SELECT * FROM aulas WHERE modulo_id = rec.id ORDER BY ordem
    LOOP
      INSERT INTO aulas (modulo_id, titulo, conteudo_html, video_url, ordem)
      VALUES (v_new_module_id, aula_rec.titulo, aula_rec.conteudo_html, aula_rec.video_url, aula_rec.ordem)
      RETURNING id INTO v_new_aula_id;

      -- Mapear ID antigo -> novo
      v_aula_map := v_aula_map || jsonb_build_object(aula_rec.id::text, v_new_aula_id::text);
    END LOOP;
  END LOOP;

  -- ========== CLONAR IMAGENS DAS AULAS ==========
  FOR rec IN
    SELECT ai.* FROM aula_imagens ai
    INNER JOIN aulas a ON ai.aula_id = a.id
    INNER JOIN modulos m ON a.modulo_id = m.id
    WHERE m.curso_id = p_original_curso_id
  LOOP
    -- Só inserir se a aula foi mapeada
    IF v_aula_map ? rec.aula_id::text THEN
      INSERT INTO aula_imagens (aula_id, url, ordem)
      VALUES ((v_aula_map->>rec.aula_id::text)::uuid, rec.url, rec.ordem)
      ON CONFLICT (aula_id, ordem) DO NOTHING;
    END IF;
  END LOOP;

  -- ========== CLONAR QUESTIONÁRIOS ==========
  FOR rec IN SELECT * FROM questionarios WHERE curso_id = p_original_curso_id
  LOOP
    INSERT INTO questionarios (curso_id, modulo_id, titulo, tipo)
    VALUES (
      v_new_course_id,
      CASE WHEN rec.modulo_id IS NOT NULL AND v_module_map ? rec.modulo_id::text
           THEN (v_module_map->>rec.modulo_id::text)::uuid
           ELSE NULL END,
      rec.titulo,
      rec.tipo
    )
    RETURNING id INTO v_new_quiz_id;

    -- ========== CLONAR QUESTÕES ==========
    INSERT INTO questoes (questionario_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, correta)
    SELECT v_new_quiz_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, correta
    FROM questoes WHERE questionario_id = rec.id;
  END LOOP;

  RETURN v_new_course_id;
END;
$$;

-- ============================================
-- 5. Permissões
-- ============================================

GRANT EXECUTE ON FUNCTION public.should_clone_for_editing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_clone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clone_course_for_editing(uuid) TO authenticated;
