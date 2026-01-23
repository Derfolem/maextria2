CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text NOT NULL UNIQUE,
  resumo text,
  conteudo_html text NOT NULL,
  autor text NOT NULL,
  imagem_capa_url text,
  publicado boolean NOT NULL DEFAULT false,
  publicado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_publicado_em
  ON public.blog_posts (publicado_em DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog publicado e publico" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins podem criar posts do blog" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins podem atualizar posts do blog" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins podem deletar posts do blog" ON public.blog_posts;

CREATE POLICY "Blog publicado e publico"
  ON public.blog_posts
  FOR SELECT
  USING (publicado = true);

CREATE POLICY "Admins podem criar posts do blog"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar posts do blog"
  ON public.blog_posts
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar posts do blog"
  ON public.blog_posts
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.blog_posts (
  titulo,
  slug,
  resumo,
  conteudo_html,
  autor,
  imagem_capa_url,
  publicado,
  publicado_em
) VALUES
(
  'Certificacoes que aceleram sua entrada no mercado',
  'certificacoes-que-aceleram-sua-entrada-no-mercado',
  'Por que certificados confiaveis encurtam o caminho ate a vaga e transformam aprendizado em prova objetiva.',
  $$<h2>O recrutador decide rapido, a prova precisa aparecer</h2>
<p>Em poucos segundos de leitura, o recrutador procura um sinal claro de preparo. Certificacoes funcionam como esse sinal porque resumem competencia em uma linha objetiva e verificavel.</p>
<p>Quando voce mostra uma prova concreta, a conversa sai do campo da promessa e entra no campo da evidencia. Isso muda o ritmo do processo e aumenta sua chance de avancar.</p>
<h2>O mercado compra evidencia, nao promessa</h2>
<p>Empresas evitam risco e, por isso, priorizam quem consegue provar o que sabe. Um curriculo bonito sem prova gera duvida; um certificado alinhado a vaga gera seguranca.</p>
<p>O ganho e simples: voce reduz o tempo de explicacao e aumenta a velocidade de decisao. Tempo e vantagem em um funil concorrido.</p>
<figure>
  <img src="/blog/certificados-sinal.svg" alt="Certificado como sinal de competencia" />
  <figcaption>Certificacoes transformam aprendizado em sinal rapido de competencia.</figcaption>
</figure>
<h2>Do curso ao convite: o fluxo que funciona</h2>
<p>Certificacao so faz sentido quando conecta aprendizado a resultado. O caminho mais curto e escolher cursos que entreguem pratica, conclusao e prova verificavel.</p>
<p>Na MAEXTRIA, as trilhas sao pensadas para isso: foco aplicado, entrega objetiva e certificado que o recrutador consegue validar.</p>
<ul>
  <li><strong>Atencao:</strong> coloque o certificado no topo do curriculo e do LinkedIn.</li>
  <li><strong>Interesse:</strong> descreva o que foi aplicado em uma frase mensuravel.</li>
  <li><strong>Desejo:</strong> conecte a habilidade a um problema real da vaga.</li>
  <li><strong>Acao:</strong> convide para ver o certificado e o projeto rapido.</li>
</ul>
<h2>Como escolher o curso certo sem desperdicio</h2>
<p>Comece pela vaga alvo e liste as habilidades mais citadas. Em seguida, escolha um curso curto que cubra exatamente essas demandas e entregue prova verificavel.</p>
<p>Seu tempo e o recurso mais caro. Use-o para produzir retorno direto e visivel.</p>
<figure>
  <img src="/curso-ia-pratica.webp" alt="Cursos praticos e certificados" />
  <figcaption>Curso pratico + certificado cria resultado rapido e comprovavel.</figcaption>
</figure>
<h2>Checklist de conversao: de curso a vaga</h2>
<ol>
  <li>Defina a vaga alvo e mapeie as habilidades exigidas.</li>
  <li>Escolha um curso curto com certificado verificavel.</li>
  <li>Conclua com foco em resultado, nao em horas assistidas.</li>
  <li>Crie um mini projeto que prove o aprendizado.</li>
  <li>Atualize curriculo e LinkedIn com o certificado e o projeto.</li>
  <li>Envie uma mensagem direta mostrando prova e resultado.</li>
</ol>
<h2>Fechamento: prova muda velocidade</h2>
<p>Certificacoes aceleram sua entrada no mercado porque mostram exatamente o que o recrutador precisa ver. Quando a prova aparece, a duvida diminui e o convite fica mais proximo.</p>
<p>Escolha a trilha certa, conclua e apresente evidencia. Esse e o caminho mais curto entre voce e a vaga.</p>
$$,
  'Equipe Maextria',
  '/banners/maextria-banner-gratis.png',
  true,
  now()
),
(
  'Profissoes do futuro e as novas trilhas de carreira',
  'profissoes-do-futuro-e-as-novas-trilhas-de-carreira',
  'Como escolher habilidades com demanda e montar uma trilha rapida que gera prova e convites.',
  $$<h2>O futuro ja esta em andamento</h2>
<p>As profissoes do futuro nao estao no horizonte, elas ja aparecem em projetos, squads e selecoes atuais. Quem entende esse movimento sai da expectativa e entra na estrategia.</p>
<p>Este guia mostra como transformar incerteza em direcao, com foco em habilidades aplicaveis e certificacoes que comprovam preparo.</p>
<h2>Escolher pela moda gera atraso</h2>
<p>Carreiras de moda mudam rapido e nem sempre viram vaga real. Quando a escolha nao tem fundamento, o resultado aparece em tempo perdido e frustracao acumulada.</p>
<p>O que protege sua carreira nao e a tendencia do momento, e a habilidade que resolve dor real.</p>
<figure>
  <img src="/blog/trilha-futuro.svg" alt="Trilha para profissoes do futuro" />
  <figcaption>Uma trilha clara conecta habilidade, prova e oportunidade.</figcaption>
</figure>
<h2>Trilhas curtas, certificadas e orientadas ao mercado</h2>
<p>As melhores transicoes acontecem quando voce escolhe uma habilidade com demanda e prova que domina o essencial. Certificacoes curtas encurtam a entrada e aumentam a confianca de quem contrata.</p>
<p>Na MAEXTRIA, as trilhas foram desenhadas para este movimento: foco, aplicacao e certificado verificavel.</p>
<h2>Areas que crescem porque resolvem problemas reais</h2>
<ul>
  <li>Dados e analise para decisao rapida e confiavel.</li>
  <li>Automacao de processos para eficiencia e escala.</li>
  <li>Experiencia do usuario para fidelizacao e crescimento.</li>
  <li>Seguranca digital para reduzir risco e perdas.</li>
  <li>Gestao de projetos para previsibilidade e entrega.</li>
  <li>Educacao corporativa para acelerar aprendizado interno.</li>
</ul>
<h2>Plano em 30 dias para ganhar tracao</h2>
<p>Em 30 dias, voce pode montar narrativa, prova e prontidao. O segredo e ter um plano simples e executar com ritmo.</p>
<ol>
  <li>Semana 1: escolha a habilidade base e um curso objetivo.</li>
  <li>Semana 2: pratique com um mini projeto real.</li>
  <li>Semana 3: finalize o curso e emita o certificado.</li>
  <li>Semana 4: atualize perfil e apresente a prova.</li>
</ol>
<figure>
  <img src="/banners/maextria-banner-gratis.png" alt="Plano de evolucao em 30 dias" />
  <figcaption>Trilha curta, prova clara, resultado objetivo.</figcaption>
</figure>
<h2>O que diferencia quem consegue a vaga</h2>
<p>Clareza de objetivo, prova pratica e comunicacao direta. Quando curso, projeto e vaga conversam entre si, a entrevista chega mais rapido.</p>
<p>Se o futuro parece incerto, escolha o proximo passo certo e torne a prova visivel.</p>
<h2>Fechamento: trilha vence improviso</h2>
<p>O futuro pertence a quem aprende rapido e aplica com foco. Voce nao precisa saber tudo; precisa escolher a habilidade certa e construir evidencia.</p>
<p>Entre na trilha, conclua e mostre o resultado. Essa e a rota mais segura para crescer.</p>
$$,
  'Equipe Maextria',
  '/curso-ia-pratica.webp',
  true,
  now()
),
(
  'Industria 4.0 e a exigencia de novas skills',
  'industria-40-e-a-exigencia-de-novas-skills',
  'A industria moderna exige tecnologia, processos inteligentes e profissionais com prova de atualizacao.',
  $$<h2>O chao de fabrica virou sistema inteligente</h2>
<p>Processos conectados, dados em tempo real e decisao rapida mudaram o jogo da industria. Quem nao acompanha fica para tras, quem se atualiza vira referencia.</p>
<p>Este artigo mostra quais skills ganharam peso e como transformar esse movimento em oportunidades concretas.</p>
<h2>A industria quer previsibilidade e prova</h2>
<p>Erros custam caro, atrasos custam caro, falhas custam caro. Por isso as empresas buscam padrao, processo e pessoas preparadas.</p>
<p>Sem prova de preparo, o profissional perde espaco. Com prova, ganha confianca imediata.</p>
<figure>
  <img src="/blog/industria-fluxo.svg" alt="Processos inteligentes na industria 4.0" />
  <figcaption>Industria 4.0 conecta processos, dados e decisao em tempo real.</figcaption>
</figure>
<h2>Skills tecnicas + certificacao valida</h2>
<p>As empresas querem conhecimento aplicado e certificado. Isso reduz risco e acelera a decisao de contratar.</p>
<p>Certificacao valida mostra que voce segue metodo e sabe aplicar processos industriais atuais.</p>
<p>Na MAEXTRIA, os cursos traduzem demandas reais da industria em conteudo direto e comprovavel.</p>
<h2>Skills que mais aparecem nas vagas industriais</h2>
<ul>
  <li>Leitura de indicadores e dados operacionais.</li>
  <li>Automacao basica e controle de processos.</li>
  <li>Manutencao preditiva e preventiva.</li>
  <li>Seguranca operacional e qualidade integrada.</li>
  <li>Gestao enxuta e melhoria continua.</li>
</ul>
<h2>PAS aplicado: o caminho curto</h2>
<p><strong>Problema:</strong> o mercado industrial exige profissionais atualizados.</p>
<p><strong>Agitacao:</strong> quem nao se atualiza perde oportunidades e ritmo.</p>
<p><strong>Solucao:</strong> cursos objetivos com certificados reconhecidos e aplicacao direta.</p>
<figure>
  <img src="/og-maextria.png" alt="Atualizacao industrial e certificacao" />
  <figcaption>Atualizar-se e certificar-se virou requisito, nao opcao.</figcaption>
</figure>
<h2>Plano simples para se destacar na industria</h2>
<ol>
  <li>Escolha uma skill critica da sua area.</li>
  <li>Inscreva-se em um curso com certificado.</li>
  <li>Conclua e documente o aprendizado.</li>
  <li>Mostre evidencias de aplicacao no seu ambiente.</li>
  <li>Atualize curriculo e perfil com dados objetivos.</li>
</ol>
<h2>Fechamento: o valor de estar pronto</h2>
<p>A industria nao desacelera. Ela exige mais tecnologia, mais processo e mais preparo. Quem se atualiza e certifica ganha prioridade e crescimento.</p>
<p>Se o mercado industrial exige novas skills, a resposta e clara: aprenda, certifique e avance.</p>
$$,
  'Equipe Maextria',
  '/og-maextria.png',
  true,
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  resumo = EXCLUDED.resumo,
  conteudo_html = EXCLUDED.conteudo_html,
  autor = EXCLUDED.autor,
  imagem_capa_url = EXCLUDED.imagem_capa_url,
  publicado = EXCLUDED.publicado,
  publicado_em = EXCLUDED.publicado_em,
  atualizado_em = now();
