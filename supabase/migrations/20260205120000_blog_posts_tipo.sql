ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'blog';

CREATE INDEX IF NOT EXISTS idx_blog_posts_tipo
  ON public.blog_posts (tipo);
