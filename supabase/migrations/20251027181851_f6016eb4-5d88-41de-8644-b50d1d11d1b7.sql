-- Tabela para posts do calendário editorial
CREATE TABLE public.marketing_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  plataforma TEXT NOT NULL, -- Instagram, Facebook, LinkedIn, etc.
  tipo TEXT NOT NULL, -- post, story, artigo, email
  status TEXT NOT NULL DEFAULT 'rascunho', -- rascunho, agendado, publicado, cancelado
  data_agendamento TIMESTAMP WITH TIME ZONE,
  data_publicacao TIMESTAMP WITH TIME ZONE,
  imagem_url TEXT,
  hashtags TEXT[],
  autor_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para leads do CRM
CREATE TABLE public.marketing_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  cargo TEXT,
  origem TEXT, -- website, facebook, linkedin, indicacao, etc.
  status TEXT NOT NULL DEFAULT 'novo', -- novo, contato, qualificado, proposta, negociacao, ganho, perdido
  pontuacao INTEGER DEFAULT 0, -- lead scoring
  interesse_curso_id UUID,
  notas TEXT,
  responsavel_id UUID,
  data_primeiro_contato TIMESTAMP WITH TIME ZONE,
  data_ultimo_contato TIMESTAMP WITH TIME ZONE,
  valor_potencial NUMERIC(10,2),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para histórico de interações com leads
CREATE TABLE public.marketing_lead_atividades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- email, ligacao, reuniao, nota, proposta
  descricao TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_lead_atividades ENABLE ROW LEVEL SECURITY;

-- Políticas para marketing_posts
CREATE POLICY "Admins podem ver todos posts"
  ON public.marketing_posts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar posts"
  ON public.marketing_posts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar posts"
  ON public.marketing_posts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar posts"
  ON public.marketing_posts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para marketing_leads
CREATE POLICY "Admins podem ver todos leads"
  ON public.marketing_leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar leads"
  ON public.marketing_leads FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar leads"
  ON public.marketing_leads FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar leads"
  ON public.marketing_leads FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para marketing_lead_atividades
CREATE POLICY "Admins podem ver todas atividades"
  ON public.marketing_lead_atividades FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar atividades"
  ON public.marketing_lead_atividades FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar atividades"
  ON public.marketing_lead_atividades FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar atividades"
  ON public.marketing_lead_atividades FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketing_posts_updated_at
  BEFORE UPDATE ON public.marketing_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketing_updated_at();

CREATE TRIGGER update_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_marketing_updated_at();

-- Índices para melhor performance
CREATE INDEX idx_marketing_posts_status ON public.marketing_posts(status);
CREATE INDEX idx_marketing_posts_data_agendamento ON public.marketing_posts(data_agendamento);
CREATE INDEX idx_marketing_leads_status ON public.marketing_leads(status);
CREATE INDEX idx_marketing_leads_email ON public.marketing_leads(email);
CREATE INDEX idx_marketing_lead_atividades_lead_id ON public.marketing_lead_atividades(lead_id);