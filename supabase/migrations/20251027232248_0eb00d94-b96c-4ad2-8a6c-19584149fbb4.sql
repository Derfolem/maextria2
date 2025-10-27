-- Criar enum para permissões de colaboradores
CREATE TYPE public.colaborador_permissao AS ENUM (
  'gerenciar_cursos',
  'gerenciar_modulos',
  'gerenciar_aulas',
  'gerenciar_questoes',
  'visualizar_usuarios',
  'gerenciar_conteudo',
  'visualizar_financeiro',
  'gerenciar_marketing'
);

-- Tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(usuario_id)
);

-- Tabela de permissões dos colaboradores
CREATE TABLE public.colaborador_permissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  permissao colaborador_permissao NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(colaborador_id, permissao)
);

-- Nova tabela de aulas (estrutura: Curso > Módulo > Aulas)
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  conteudo_html TEXT,
  video_url TEXT,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para progresso de aulas
CREATE TABLE public.progresso_aula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES public.aulas(id) ON DELETE CASCADE,
  concluido BOOLEAN DEFAULT false,
  concluido_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(usuario_id, aula_id)
);

-- Enable RLS
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_aula ENABLE ROW LEVEL SECURITY;

-- RLS Policies para colaboradores
CREATE POLICY "Admins podem ver todos colaboradores"
  ON public.colaboradores FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar colaboradores"
  ON public.colaboradores FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar colaboradores"
  ON public.colaboradores FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar colaboradores"
  ON public.colaboradores FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores podem ver próprio registro"
  ON public.colaboradores FOR SELECT
  USING (auth.uid() = usuario_id);

-- RLS Policies para permissões de colaboradores
CREATE POLICY "Admins podem ver todas permissões"
  ON public.colaborador_permissoes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem criar permissões"
  ON public.colaborador_permissoes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar permissões"
  ON public.colaborador_permissoes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Colaboradores podem ver próprias permissões"
  ON public.colaborador_permissoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.colaboradores
      WHERE colaboradores.id = colaborador_permissoes.colaborador_id
      AND colaboradores.usuario_id = auth.uid()
    )
  );

-- RLS Policies para aulas
CREATE POLICY "Aulas são públicas para leitura"
  ON public.aulas FOR SELECT
  USING (true);

CREATE POLICY "Admins podem criar aulas"
  ON public.aulas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem atualizar aulas"
  ON public.aulas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar aulas"
  ON public.aulas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para progresso de aulas
CREATE POLICY "Usuários veem próprio progresso"
  ON public.progresso_aula FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar próprio progresso"
  ON public.progresso_aula FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar próprio progresso"
  ON public.progresso_aula FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Criar storage bucket para imagens
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-images', 'course-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket de imagens
CREATE POLICY "Imagens são públicas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-images');

CREATE POLICY "Admins podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem atualizar imagens"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-images'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins podem deletar imagens"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-images'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Função auxiliar para verificar se é colaborador com permissão
CREATE OR REPLACE FUNCTION public.has_colaborador_permissao(_user_id uuid, _permissao colaborador_permissao)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.colaboradores c
    JOIN public.colaborador_permissoes cp ON c.id = cp.colaborador_id
    WHERE c.usuario_id = _user_id
    AND c.ativo = true
    AND cp.permissao = _permissao
  )
$$;