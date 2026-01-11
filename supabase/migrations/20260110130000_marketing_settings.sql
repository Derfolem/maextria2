-- Marketing settings + pageview metrics
CREATE TABLE IF NOT EXISTS public.marketing_pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_pageviews_created_at
  ON public.marketing_pageviews (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_pageviews_path
  ON public.marketing_pageviews (path);

ALTER TABLE public.marketing_pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonimos podem inserir pageviews"
  ON public.marketing_pageviews
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins podem ver pageviews"
  ON public.marketing_pageviews
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.configuracoes_site (chave, valor, descricao) VALUES
  ('marketing_banner_enabled', '0', 'Exibe o banner global no topo do site (1 = ativo)'),
  ('marketing_banner_image_url', '', 'URL da imagem do banner'),
  ('marketing_banner_link_url', '', 'Link do banner (opcional)'),
  ('marketing_banner_alt', 'Banner promocional', 'Texto alternativo do banner'),
  ('marketing_pixel_head', '', 'Codigo de pixel para inserir no <head>'),
  ('marketing_pixel_body', '', 'Codigo de pixel para inserir no <body>'),
  ('seo_meta_title', '', 'Titulo SEO global'),
  ('seo_meta_description', '', 'Descricao SEO global'),
  ('seo_meta_keywords', '', 'Palavras-chave SEO'),
  ('seo_meta_robots', 'index,follow', 'Robots meta tag'),
  ('seo_canonical_url', '', 'Canonical URL global'),
  ('marketing_backlinks', '', 'Lista de backlinks (texto livre)')
ON CONFLICT (chave) DO NOTHING;
