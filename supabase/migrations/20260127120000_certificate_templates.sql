-- Tabela de modelos de certificado
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  titulo text NOT NULL,
  subtitulo text NOT NULL,
  linha_curso text NOT NULL,
  descricao text NOT NULL,
  local_emissao text NOT NULL,
  assinatura_label text NOT NULL,
  legal_texto text NOT NULL,
  label_carga_horaria text NOT NULL DEFAULT 'Carga horaria',
  label_modalidade text NOT NULL DEFAULT 'Modalidade',
  label_data text NOT NULL DEFAULT 'Data de conclusao',
  label_codigo text NOT NULL DEFAULT 'Codigo de validacao',
  modalidade_texto text NOT NULL DEFAULT 'Online (EAD)',
  ativo boolean DEFAULT false,
  criado_em timestamptz DEFAULT now(),
  UNIQUE (nome)
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem gerenciar modelos
CREATE POLICY "Admins can view certificate templates"
  ON public.certificate_templates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert certificate templates"
  ON public.certificate_templates FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificate templates"
  ON public.certificate_templates FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete certificate templates"
  ON public.certificate_templates FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Garantir apenas um modelo ativo
CREATE UNIQUE INDEX IF NOT EXISTS certificate_templates_single_active
  ON public.certificate_templates (ativo)
  WHERE ativo;

-- Modelo padrao
INSERT INTO public.certificate_templates (
  nome,
  titulo,
  subtitulo,
  linha_curso,
  descricao,
  local_emissao,
  assinatura_label,
  legal_texto,
  label_carga_horaria,
  label_modalidade,
  label_data,
  label_codigo,
  modalidade_texto,
  ativo
) VALUES (
  'Padrao MAEXTRIA',
  'CERTIFICADO DE CONCLUSAO',
  'Certificamos que',
  'concluiu com exito o curso',
  'promovido pela plataforma MAEXTRIA, com carga horaria total de {{carga_horaria}} horas, realizado na modalidade {{modalidade}}, com foco em aplicacao pratica, desenvolvimento profissional e formacao continuada.',
  'Rio de Janeiro - RJ',
  'Diretoria Academica - MAEXTRIA',
  'Cursos livres realizados na modalidade Educacao a Distancia, conforme legislacao brasileira vigente, incluindo o Decreto no 9.057/2017 e normas aplicaveis a formacao continuada. Conteudo alinhado as boas praticas da ABED - Associacao Brasileira de Educacao a Distancia.',
  'Carga horaria',
  'Modalidade',
  'Data de conclusao',
  'Codigo de validacao',
  'Online (EAD)',
  true
)
ON CONFLICT (nome) DO NOTHING;
