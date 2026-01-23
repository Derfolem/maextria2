ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog publicado e publico" ON public.blog_posts;

CREATE POLICY "Blog publicado ou admin"
  ON public.blog_posts
  FOR SELECT
  USING (
    publicado = true OR public.has_role(auth.uid(), 'admin'::app_role)
  );
