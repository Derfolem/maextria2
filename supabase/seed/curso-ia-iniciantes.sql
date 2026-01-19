BEGIN;

WITH course AS (
  INSERT INTO public.cursos (
    titulo,
    slug,
    descricao,
    imagem_capa_url,
    ativo,
    categoria,
    preco_certificado,
    professor_nome
  )
  VALUES (
    'Curso de Inteligencia Artificial para Iniciantes (com Certificado)',
    'curso-inteligencia-artificial-para-iniciantes',
    'O Curso de Inteligencia Artificial para Iniciantes da MAEXTRIA e ideal para quem deseja aprender IA do zero, mesmo sem conhecimento tecnico. Voce vai entender o que e inteligencia artificial, como ela funciona na pratica e como pode ser usada no trabalho, nos estudos e no dia a dia. Curso online, linguagem simples e certificado digital incluso para curriculo, LinkedIn e horas complementares.',
    'https://images.unsplash.com/photo-1677442d019cecf8949e0a6109d9a29d969afa6bc?w=800&q=80',
    true,
    'Tecnologia e Inovacao',
    49.90,
    'Equipe Maextria'
  )
  RETURNING id
),
m1 AS (
  INSERT INTO public.modulos (
    curso_id,
    ordem,
    titulo_modulo,
    conteudo_texto_html,
    video_url
  )
  SELECT
    course.id,
    1,
    'O que e Inteligencia Artificial',
    '<p>Neste modulo voce vai entender, de forma simples, o que e inteligencia artificial, por que ela se tornou tao importante e onde ela ja esta presente no seu dia a dia. Vamos quebrar mitos, eliminar termos tecnicos desnecessarios e focar no entendimento pratico.</p>',
    NULL
  FROM course
  RETURNING id
),
m1_a1 AS (
  INSERT INTO public.aulas (
    modulo_id,
    ordem,
    titulo,
    conteudo_html,
    video_url
  )
  SELECT
    m1.id,
    1,
    'Entendendo a Inteligencia Artificial do Zero',
    '<p>Inteligencia Artificial e a capacidade que sistemas computacionais tem de simular comportamentos humanos, como aprender, analisar informacoes e tomar decisoes.</p><p>Nesta aula, voce vai aprender:</p><ul><li>O que e inteligencia artificial</li><li>Exemplos simples de IA no dia a dia</li><li>Diferenca entre IA, automacao e robos</li><li>Por que a IA esta crescendo tao rapido</li></ul><p>Ao final da aula, voce ja tera uma visao clara e sem complicacoes sobre o tema.</p>',
    NULL
  FROM m1
  RETURNING id
),
m1_quiz AS (
  INSERT INTO public.questionarios (
    curso_id,
    modulo_id,
    titulo,
    tipo
  )
  SELECT
    course.id,
    m1.id,
    'Questionario do modulo: O que e Inteligencia Artificial',
    'modulo'
  FROM course, m1
  RETURNING id
),
m1_q AS (
  INSERT INTO public.questoes (
    questionario_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    correta
  )
  SELECT
    m1_quiz.id,
    'Qual afirmacao diferencia melhor IA de automacao tradicional?',
    'IA sempre usa robos fisicos, automacao nao',
    'IA aprende padroes a partir de dados; automacao repete regras fixas',
    'IA so funciona com internet; automacao nao',
    'IA e apenas um tipo de hardware',
    'b'
  FROM m1_quiz
  UNION ALL
  SELECT
    m1_quiz.id,
    'Qual exemplo indica o uso de IA e nao apenas automacao?',
    'Planilha que soma valores automaticamente',
    'Sistema que ajusta recomendacoes conforme o comportamento do usuario',
    'Relogio que dispara alarme em horario fixo',
    'Impressora que imprime em lote',
    'b'
  FROM m1_quiz
  RETURNING id
),
m2 AS (
  INSERT INTO public.modulos (
    curso_id,
    ordem,
    titulo_modulo,
    conteudo_texto_html,
    video_url
  )
  SELECT
    course.id,
    2,
    'Como a Inteligencia Artificial Funciona na Pratica',
    '<p>Neste modulo voce vai entender como a inteligencia artificial aprende, analisa informacoes e gera respostas. Tudo explicado de forma simples, sem programacao.</p>',
    NULL
  FROM course
  RETURNING id
),
m2_a1 AS (
  INSERT INTO public.aulas (
    modulo_id,
    ordem,
    titulo,
    conteudo_html,
    video_url
  )
  SELECT
    m2.id,
    1,
    'Como a IA Aprende e Toma Decisoes',
    '<p>A inteligencia artificial aprende analisando grandes volumes de dados e identificando padroes.</p><p>Nesta aula voce vera:</p><ul><li>O que sao dados</li><li>O que sao padroes</li><li>Por que a IA melhora com o tempo</li><li>Exemplos praticos de aprendizado de maquina</li></ul>',
    NULL
  FROM m2
  RETURNING id
),
m2_quiz AS (
  INSERT INTO public.questionarios (
    curso_id,
    modulo_id,
    titulo,
    tipo
  )
  SELECT
    course.id,
    m2.id,
    'Questionario do modulo: Funcionamento da IA',
    'modulo'
  FROM course, m2
  RETURNING id
),
m2_q AS (
  INSERT INTO public.questoes (
    questionario_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    correta
  )
  SELECT
    m2_quiz.id,
    'Por que modelos de IA podem melhorar com o tempo?',
    'Porque recebem mais dados e ajustam os padroes aprendidos',
    'Porque trocam o hardware automaticamente',
    'Porque alguem programa todas as respostas manualmente',
    'Porque nao precisam de dados reais',
    'a'
  FROM m2_quiz
  UNION ALL
  SELECT
    m2_quiz.id,
    'O que melhor descreve o papel dos dados em IA?',
    'Servem apenas para armazenamento',
    'Sao usados para identificar padroes e gerar previsoes',
    'Sao dispensaveis quando ha bons programadores',
    'Apenas aceleram o processamento, sem impactar decisoes',
    'b'
  FROM m2_quiz
  RETURNING id
),
m3 AS (
  INSERT INTO public.modulos (
    curso_id,
    ordem,
    titulo_modulo,
    conteudo_texto_html,
    video_url
  )
  SELECT
    course.id,
    3,
    'Inteligencia Artificial no Trabalho e no Dia a Dia',
    '<p>Neste modulo voce vera aplicacoes reais da inteligencia artificial no trabalho, nos estudos e na vida pessoal.</p>',
    NULL
  FROM course
  RETURNING id
),
m3_a1 AS (
  INSERT INTO public.aulas (
    modulo_id,
    ordem,
    titulo,
    conteudo_html,
    video_url
  )
  SELECT
    m3.id,
    1,
    'Usando IA para Facilitar sua Vida',
    '<p>A inteligencia artificial pode ajudar voce a economizar tempo, organizar tarefas e melhorar resultados.</p><ul><li>IA para produtividade</li><li>IA para estudos</li><li>IA para trabalho e negocios</li></ul>',
    NULL
  FROM m3
  RETURNING id
),
m3_quiz AS (
  INSERT INTO public.questionarios (
    curso_id,
    modulo_id,
    titulo,
    tipo
  )
  SELECT
    course.id,
    m3.id,
    'Questionario do modulo: IA no Dia a Dia',
    'modulo'
  FROM course, m3
  RETURNING id
),
m3_q AS (
  INSERT INTO public.questoes (
    questionario_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    correta
  )
  SELECT
    m3_quiz.id,
    'Qual cenario mostra uso de IA para produtividade pessoal?',
    'Calendario que so dispara lembrete em horario fixo',
    'Assistente que prioriza tarefas com base no seu historico',
    'Calculadora que soma automaticamente',
    'Editor de texto sem sugestoes',
    'b'
  FROM m3_quiz
  UNION ALL
  SELECT
    m3_quiz.id,
    'Qual risco deve ser considerado ao usar IA no trabalho?',
    'Perda total de arquivos por padrao',
    'Dependencia de dados incorretos que geram decisoes erradas',
    'IA nunca comete erros',
    'Impossibilidade de revisao humana',
    'b'
  FROM m3_quiz
  RETURNING id
),
final_quiz AS (
  INSERT INTO public.questionarios (
    curso_id,
    titulo,
    tipo
  )
  SELECT
    course.id,
    'Prova final - Inteligencia Artificial para Iniciantes',
    'final'
  FROM course
  RETURNING id
),
final_q AS (
  INSERT INTO public.questoes (
    questionario_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    correta
  )
  SELECT
    final_quiz.id,
    'Qual e a relacao correta entre dados, padroes e decisoes em IA?',
    'Decisoes sao aleatorias, padroes nao importam',
    'Padroes sao extraidos de dados e orientam decisoes',
    'Padroes substituem totalmente a necessidade de dados',
    'Dados so sao usados apos a decisao',
    'b'
  FROM final_quiz
  UNION ALL
  SELECT
    final_quiz.id,
    'Qual afirmacao descreve melhor um uso responsavel de IA?',
    'Usar qualquer saida sem validacao',
    'Validar resultados e entender limitacoes do modelo',
    'Evitar dados reais para nao enviesar',
    'Confiar apenas na IA, sem revisao humana',
    'b'
  FROM final_quiz
  UNION ALL
  SELECT
    final_quiz.id,
    'O que diferencia um sistema de IA de um sistema com regras fixas?',
    'IA nao precisa de dados',
    'IA adapta-se ao aprender padroes nos dados',
    'IA sempre usa robos fisicos',
    'IA e so um tipo de banco de dados',
    'b'
  FROM final_quiz
  RETURNING id
)
SELECT id AS curso_id FROM course;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cursos'
      AND column_name = 'nivel'
  ) THEN
    UPDATE public.cursos
    SET nivel = 'Iniciante'
    WHERE slug = 'curso-inteligencia-artificial-para-iniciantes';
  END IF;
END $$;

COMMIT;
