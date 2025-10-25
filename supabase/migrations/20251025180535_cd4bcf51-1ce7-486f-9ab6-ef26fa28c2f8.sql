-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  email text UNIQUE NOT NULL,
  cpf text,
  criado_em timestamptz DEFAULT now()
);

-- Criar tabela de cursos
CREATE TABLE IF NOT EXISTS public.cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  descricao text,
  carga_horaria_horas integer,
  publico_alvo text,
  imagem_capa_url text,
  ativo boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- Criar tabela de módulos
CREATE TABLE IF NOT EXISTS public.modulos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  titulo_modulo text NOT NULL,
  conteudo_texto_html text,
  video_url text,
  criado_em timestamptz DEFAULT now()
);

-- Criar tabela de progresso de módulo
CREATE TABLE IF NOT EXISTS public.progresso_modulo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  modulo_id uuid REFERENCES public.modulos(id) ON DELETE CASCADE,
  concluido boolean DEFAULT false,
  concluido_em timestamptz,
  UNIQUE(usuario_id, modulo_id)
);

-- Criar tabela de questões da prova
CREATE TABLE IF NOT EXISTS public.prova_questoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
  enunciado text NOT NULL,
  alternativa_a text NOT NULL,
  alternativa_b text NOT NULL,
  alternativa_c text NOT NULL,
  alternativa_d text NOT NULL,
  correta text NOT NULL CHECK (correta IN ('a', 'b', 'c', 'd'))
);

-- Criar tabela de resultado da prova
CREATE TABLE IF NOT EXISTS public.prova_resultado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
  total_questoes integer NOT NULL,
  acertos integer NOT NULL,
  percentual numeric NOT NULL,
  aprovado boolean NOT NULL,
  realizado_em timestamptz DEFAULT now(),
  UNIQUE(usuario_id, curso_id)
);

-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS public.certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  curso_id uuid REFERENCES public.cursos(id) ON DELETE CASCADE,
  codigo_validacao text UNIQUE NOT NULL,
  link_pdf text,
  emitido_em timestamptz DEFAULT now(),
  pago boolean DEFAULT false
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prova_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prova_resultado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários (apenas próprio usuário)
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.usuarios FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.usuarios FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Políticas RLS para cursos (público para leitura)
CREATE POLICY "Cursos são públicos"
  ON public.cursos FOR SELECT
  USING (ativo = true);

-- Políticas RLS para módulos (público para leitura)
CREATE POLICY "Módulos são públicos"
  ON public.modulos FOR SELECT
  USING (true);

-- Políticas RLS para progresso (apenas próprio progresso)
CREATE POLICY "Usuários veem próprio progresso"
  ON public.progresso_modulo FOR SELECT
  USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem criar próprio progresso"
  ON public.progresso_modulo FOR INSERT
  WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem atualizar próprio progresso"
  ON public.progresso_modulo FOR UPDATE
  USING (auth.uid()::text = usuario_id::text);

-- Políticas RLS para questões da prova (público para leitura)
CREATE POLICY "Questões são públicas"
  ON public.prova_questoes FOR SELECT
  USING (true);

-- Políticas RLS para resultado da prova (apenas próprio resultado)
CREATE POLICY "Usuários veem próprio resultado"
  ON public.prova_resultado FOR SELECT
  USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem criar próprio resultado"
  ON public.prova_resultado FOR INSERT
  WITH CHECK (auth.uid()::text = usuario_id::text);

CREATE POLICY "Usuários podem atualizar próprio resultado"
  ON public.prova_resultado FOR UPDATE
  USING (auth.uid()::text = usuario_id::text);

-- Políticas RLS para certificados (apenas próprio certificado + público por código)
CREATE POLICY "Usuários veem próprios certificados"
  ON public.certificados FOR SELECT
  USING (auth.uid()::text = usuario_id::text);

CREATE POLICY "Certificados públicos por código"
  ON public.certificados FOR SELECT
  USING (codigo_validacao IS NOT NULL);

-- Trigger para criar perfil de usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir curso Marketing Pessoal
INSERT INTO public.cursos (id, titulo, slug, descricao, carga_horaria_horas, publico_alvo, imagem_capa_url, ativo)
VALUES (
  'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid,
  'Marketing Pessoal',
  'marketing-pessoal',
  'Aprenda a construir e comunicar sua imagem profissional, fortalecer sua presença e se posicionar para crescer na carreira.',
  20,
  'Profissionais que querem melhorar posicionamento, aparência profissional, currículo e presença em entrevistas.',
  '/src/assets/marketing-pessoal-cover.jpg',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Inserir módulos do curso Marketing Pessoal
INSERT INTO public.modulos (id, curso_id, ordem, titulo_modulo, conteudo_texto_html, video_url) VALUES
('11111111-1111-1111-1111-000000000001'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 1, 'Módulo 1: Conceito de Marketing Pessoal', '<h2>Conceito de Marketing Pessoal</h2><p>Marketing pessoal é o conjunto de ações conscientes para construir e comunicar sua melhor versão profissional. Ele trata da forma como você quer ser percebido, e como essa percepção influencia oportunidades de carreira.</p>', NULL),
('11111111-1111-1111-1111-000000000002'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 2, 'Módulo 2: Qualidade Pessoal e Autodesenvolvimento', '<h2>Qualidade pessoal e evolução contínua</h2><p>Autodesenvolvimento é identidade em construção. A forma como você se avalia, busca melhoria e demonstra consistência gera confiança e reputação.</p>', NULL),
('11111111-1111-1111-1111-000000000003'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 3, 'Módulo 3: Pontos que Colaboram para o seu Sucesso', '<h2>Fatores de sucesso</h2><ul><li>Postura profissional</li><li>Pontualidade</li><li>Comunicação clara</li><li>Rede de relacionamento (networking)</li></ul>', NULL),
('11111111-1111-1111-1111-000000000004'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 4, 'Módulo 4: Uma Marca Chamada "Você"', '<p>Você já é uma marca. O que as pessoas associam ao seu nome quando você não está presente? Confiável? Técnico? Resolutivo? Inspirador?</p>', NULL),
('11111111-1111-1111-1111-000000000005'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 5, 'Módulo 5: Aspectos do Marketing Pessoal', '<p>Postura, fala, vestimenta, coerência entre discurso e entrega. Tudo comunica.</p>', NULL),
('11111111-1111-1111-1111-000000000006'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 6, 'Módulo 6: Plano de Marketing Pessoal', '<p>Defina posicionamento, mensagem central, canal onde você quer ser visto, resultados que você quer que associem ao seu nome.</p>', NULL),
('11111111-1111-1111-1111-000000000007'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 7, 'Módulo 7: A Embalagem do Produto chamado "Você"', '<p>Sua imagem pessoal e apresentação visual contam. Rosto, barba/cabelo, postura, roupas, higiene, tudo isso faz parte da leitura imediata que os outros fazem.</p>', NULL),
('11111111-1111-1111-1111-000000000008'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 8, 'Módulo 8: Trajes Femininos para Diversas Ocasiões', '<p>Dress code feminino: casual profissional, social formal, ambiente industrial, reuniões externas, entrevistas.</p>', NULL),
('11111111-1111-1111-1111-000000000009'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 9, 'Módulo 9: Trajes Masculinos para Diversas Ocasiões', '<p>Dress code masculino: polo limpa e calça escura pode ser aceitável para ambientes menos formais; social completo para apresentação executiva; EPI e uniforme técnico corretamente usados em ambiente industrial.</p>', NULL),
('11111111-1111-1111-1111-000000000010'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 10, 'Módulo 10: Marketing Pessoal e o Mundo do Trabalho', '<p>Como você se posiciona em times, reuniões, plantas industriais e ambientes corporativos. Polidez e respeito são marca profissional.</p>', NULL),
('11111111-1111-1111-1111-000000000011'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 11, 'Módulo 11: Autoconhecimento e Currículo', '<p>Currículo não é lista de tarefas. É evidência de impacto: resultado, meta batida, problema resolvido.</p>', NULL),
('11111111-1111-1111-1111-000000000012'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 12, 'Módulo 12: Tipos de Currículo', '<p>Cronológico, funcional, híbrido. Adequar o formato à vaga e ao momento da carreira.</p>', NULL),
('11111111-1111-1111-1111-000000000013'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 13, 'Módulo 13: Entrevista', '<p>Entrevista é teatro técnico. Você precisa ter domínio do enredo (sua história) e clareza de como você resolve problemas reais.</p>', NULL),
('11111111-1111-1111-1111-000000000014'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 14, 'Módulo 14: Conclusão', '<p>Marketing pessoal não é ser falso; é alinhar percepção externa com seu melhor desempenho real e sustentável.</p>', NULL),
('11111111-1111-1111-1111-000000000015'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 15, 'Módulo 15: Referências Bibliográficas', '<p>Leituras recomendadas e materiais de apoio sobre imagem profissional, posicionamento e desenvolvimento de carreira.</p>', NULL)
ON CONFLICT (id) DO NOTHING;

-- Inserir questões da prova
INSERT INTO public.prova_questoes (id, curso_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, correta) VALUES
('22222222-2222-2222-2222-000000000001'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 'O que é marketing pessoal?', 'Um conjunto de ações para construir e comunicar sua imagem profissional.', 'A forma de vender produtos físicos.', 'Uma técnica para manipular pessoas.', 'Um uniforme padronizado.', 'a'),
('22222222-2222-2222-2222-000000000002'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 'Qual comportamento fortalece sua reputação profissional?', 'Chegar atrasado mas falar bem.', 'Prometer mais do que consegue entregar.', 'Comunicar com respeito e cumprir o combinado.', 'Não aceitar feedback.', 'c'),
('22222222-2222-2222-2222-000000000003'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 'O que é sua ''marca pessoal''?', 'Somente sua roupa.', 'Somente seu currículo.', 'O conjunto de percepções e expectativas que associam ao seu nome.', 'Seu crachá.', 'c'),
('22222222-2222-2222-2222-000000000004'::uuid, 'e7c8f4a1-2b3d-4e5f-6a7b-8c9d0e1f2a3b'::uuid, 'Qual currículo é mais valorizado?', 'O que só lista cargos.', 'O que demonstra resultados concretos.', 'O que tem mais páginas.', 'O que tem mais adjetivos pessoais.', 'b')
ON CONFLICT (id) DO NOTHING;