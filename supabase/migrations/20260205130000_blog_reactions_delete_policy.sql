DROP POLICY IF EXISTS "Visitantes podem remover reacao" ON public.blog_reactions;

CREATE POLICY "Visitantes podem remover reacao"
  ON public.blog_reactions
  FOR DELETE
  USING (true);
