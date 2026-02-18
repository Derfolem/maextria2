ALTER TABLE public.questoes
  ADD COLUMN IF NOT EXISTS ordem integer;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY questionario_id ORDER BY id) AS rn
  FROM public.questoes
)
UPDATE public.questoes q
SET ordem = ranked.rn
FROM ranked
WHERE q.id = ranked.id
  AND q.ordem IS NULL;
