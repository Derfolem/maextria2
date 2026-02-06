CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  nome text NOT NULL,
  comentario text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  criado_em timestamptz NOT NULL DEFAULT now(),
  publicado_em timestamptz
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id
  ON public.blog_comments (post_id);

CREATE INDEX IF NOT EXISTS idx_blog_comments_status
  ON public.blog_comments (status);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentarios publicados sao publicos" ON public.blog_comments;
DROP POLICY IF EXISTS "Visitantes podem comentar" ON public.blog_comments;
DROP POLICY IF EXISTS "Admins gerenciam comentarios" ON public.blog_comments;

CREATE POLICY "Comentarios publicados sao publicos"
  ON public.blog_comments
  FOR SELECT
  USING (status = 'aprovado');

CREATE POLICY "Visitantes podem comentar"
  ON public.blog_comments
  FOR INSERT
  WITH CHECK (length(nome) >= 2 AND length(comentario) >= 3);

CREATE POLICY "Admins gerenciam comentarios"
  ON public.blog_comments
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.blog_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  anon_id text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_reactions_unique UNIQUE (post_id, emoji, anon_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_reactions_post_id
  ON public.blog_reactions (post_id);

ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reacoes sao publicas" ON public.blog_reactions;
DROP POLICY IF EXISTS "Visitantes podem reagir" ON public.blog_reactions;
DROP POLICY IF EXISTS "Admins gerenciam reacoes" ON public.blog_reactions;

CREATE POLICY "Reacoes sao publicas"
  ON public.blog_reactions
  FOR SELECT
  USING (true);

CREATE POLICY "Visitantes podem reagir"
  ON public.blog_reactions
  FOR INSERT
  WITH CHECK (
    emoji IN ('👍', '👏', '🔥', '💡', '✅', '🎯', '🚀', '💙')
    AND length(anon_id) >= 6
  );

CREATE POLICY "Admins gerenciam reacoes"
  ON public.blog_reactions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
