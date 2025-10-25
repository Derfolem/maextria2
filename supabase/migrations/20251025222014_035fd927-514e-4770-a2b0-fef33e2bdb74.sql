-- Create table for course ratings
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(curso_id, usuario_id)
);

-- Enable RLS
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- Users can view all ratings
CREATE POLICY "Avaliações são públicas"
ON public.avaliacoes
FOR SELECT
USING (true);

-- Users can create their own ratings
CREATE POLICY "Usuários podem criar próprias avaliações"
ON public.avaliacoes
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Users can update their own ratings
CREATE POLICY "Usuários podem atualizar próprias avaliações"
ON public.avaliacoes
FOR UPDATE
USING (auth.uid() = usuario_id);

-- Users can delete their own ratings
CREATE POLICY "Usuários podem deletar próprias avaliações"
ON public.avaliacoes
FOR DELETE
USING (auth.uid() = usuario_id);

-- Admins can delete any rating
CREATE POLICY "Admins podem deletar avaliações"
ON public.avaliacoes
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create index for performance
CREATE INDEX idx_avaliacoes_curso ON public.avaliacoes(curso_id);
CREATE INDEX idx_avaliacoes_usuario ON public.avaliacoes(usuario_id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_avaliacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_avaliacoes_timestamp
BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_avaliacoes_updated_at();

-- Create table for social media configuration
CREATE TABLE public.configuracoes_site (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT,
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_site ENABLE ROW LEVEL SECURITY;

-- Everyone can view settings
CREATE POLICY "Configurações são públicas"
ON public.configuracoes_site
FOR SELECT
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins podem inserir configurações"
ON public.configuracoes_site
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar configurações"
ON public.configuracoes_site
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar configurações"
ON public.configuracoes_site
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert default social media configurations
INSERT INTO public.configuracoes_site (chave, valor, descricao) VALUES
  ('instagram_url', '', 'URL do Instagram da empresa'),
  ('facebook_url', '', 'URL do Facebook da empresa'),
  ('linkedin_url', '', 'URL do LinkedIn da empresa'),
  ('youtube_url', '', 'URL do YouTube da empresa'),
  ('twitter_url', '', 'URL do Twitter/X da empresa'),
  ('whatsapp_numero', '', 'Número do WhatsApp para contato (com DDI e DDD, ex: 5511999999999)');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_configuracoes_timestamp
BEFORE UPDATE ON public.configuracoes_site
FOR EACH ROW
EXECUTE FUNCTION public.update_avaliacoes_updated_at();