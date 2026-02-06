CREATE TABLE IF NOT EXISTS public.blog_saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_saved_posts_unique UNIQUE (usuario_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_saved_posts_user
  ON public.blog_saved_posts (usuario_id);

CREATE INDEX IF NOT EXISTS idx_blog_saved_posts_post
  ON public.blog_saved_posts (post_id);

ALTER TABLE public.blog_saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios veem seus favoritos" ON public.blog_saved_posts;
DROP POLICY IF EXISTS "Usuarios salvam favoritos" ON public.blog_saved_posts;
DROP POLICY IF EXISTS "Usuarios removem favoritos" ON public.blog_saved_posts;

CREATE POLICY "Usuarios veem seus favoritos"
  ON public.blog_saved_posts
  FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios salvam favoritos"
  ON public.blog_saved_posts
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios removem favoritos"
  ON public.blog_saved_posts
  FOR DELETE
  USING (auth.uid() = usuario_id);
