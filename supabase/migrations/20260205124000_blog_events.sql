CREATE TABLE IF NOT EXISTS public.blog_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  channel text,
  anon_id text NOT NULL,
  referrer text,
  path text,
  user_agent text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_events_post_id
  ON public.blog_events (post_id);

CREATE INDEX IF NOT EXISTS idx_blog_events_type
  ON public.blog_events (event_type);

CREATE INDEX IF NOT EXISTS idx_blog_events_created
  ON public.blog_events (criado_em DESC);

ALTER TABLE public.blog_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eventos blog somente admin" ON public.blog_events;
DROP POLICY IF EXISTS "Visitantes registram eventos blog" ON public.blog_events;

CREATE POLICY "Eventos blog somente admin"
  ON public.blog_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Visitantes registram eventos blog"
  ON public.blog_events
  FOR INSERT
  WITH CHECK (
    length(anon_id) >= 6
    AND event_type IN (
      'page_view',
      'read',
      'cta_click',
      'share',
      'comment_submitted',
      'reaction'
    )
  );

CREATE POLICY "Admins gerenciam eventos blog"
  ON public.blog_events
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));
