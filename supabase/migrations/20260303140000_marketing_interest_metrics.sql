CREATE TABLE IF NOT EXISTS public.marketing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  course_title TEXT,
  search_term TEXT,
  result_count INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT marketing_events_type_check
    CHECK (
      event_type IN (
        'course_search',
        'course_click',
        'course_cta_click',
        'trilha_start_click',
        'trilha_start_success',
        'signup_success',
        'login_success'
      )
    ),
  CONSTRAINT marketing_events_search_rule_check
    CHECK (
      event_type <> 'course_search'
      OR (search_term IS NOT NULL AND length(btrim(search_term)) >= 2)
    )
);

CREATE INDEX IF NOT EXISTS idx_marketing_events_created_at
  ON public.marketing_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_events_type_created
  ON public.marketing_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_events_session
  ON public.marketing_events (session_id);

CREATE INDEX IF NOT EXISTS idx_marketing_events_course
  ON public.marketing_events (course_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_events_search
  ON public.marketing_events (search_term, created_at DESC)
  WHERE search_term IS NOT NULL;

ALTER TABLE public.marketing_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eventos marketing somente admin" ON public.marketing_events;
DROP POLICY IF EXISTS "Visitantes registram eventos marketing" ON public.marketing_events;
DROP POLICY IF EXISTS "Admins gerenciam eventos marketing" ON public.marketing_events;

CREATE POLICY "Eventos marketing somente admin"
  ON public.marketing_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Visitantes registram eventos marketing"
  ON public.marketing_events
  FOR INSERT
  WITH CHECK (
    length(session_id) >= 8
    AND event_type IN (
      'course_search',
      'course_click',
      'course_cta_click',
      'trilha_start_click',
      'trilha_start_success',
      'signup_success',
      'login_success'
    )
  );

CREATE POLICY "Admins gerenciam eventos marketing"
  ON public.marketing_events
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.admin_interest_metrics(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_days integer := GREATEST(COALESCE(p_days, 30), 1);
  v_since timestamptz := now() - make_interval(days => GREATEST(COALESCE(p_days, 30), 1));
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem visualizar metricas.' USING ERRCODE = '42501';
  END IF;

  WITH pageviews_window AS (
    SELECT session_id, path, referrer, created_at
    FROM public.marketing_pageviews
    WHERE created_at >= v_since
  ),
  sessions_window AS (
    SELECT session_id, COUNT(*)::int AS pageviews
    FROM pageviews_window
    GROUP BY session_id
  ),
  first_seen_all AS (
    SELECT session_id, MIN(created_at) AS first_seen_all
    FROM public.marketing_pageviews
    GROUP BY session_id
  ),
  sessions_labeled AS (
    SELECT
      sw.session_id,
      sw.pageviews,
      CASE WHEN fs.first_seen_all >= v_since THEN true ELSE false END AS is_new
    FROM sessions_window sw
    JOIN first_seen_all fs USING (session_id)
  ),
  events_window AS (
    SELECT
      session_id,
      event_type,
      course_id,
      course_title,
      search_term,
      COALESCE(result_count, 0) AS result_count,
      created_at,
      user_id,
      metadata
    FROM public.marketing_events
    WHERE created_at >= v_since
  ),
  session_funnel AS (
    SELECT
      session_id,
      BOOL_OR(event_type = 'course_search') AS has_search,
      BOOL_OR(event_type = 'course_click') AS has_course_click,
      BOOL_OR(event_type = 'course_cta_click') AS has_cta,
      BOOL_OR(event_type = 'signup_success') AS has_signup_event
    FROM events_window
    GROUP BY session_id
  ),
  signups_window AS (
    SELECT COUNT(*)::int AS signups
    FROM public.usuarios
    WHERE criado_em >= v_since
  ),
  top_search_terms AS (
    SELECT
      LOWER(BTRIM(search_term)) AS term,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE result_count = 0)::int AS zero_result
    FROM events_window
    WHERE event_type = 'course_search'
      AND search_term IS NOT NULL
      AND BTRIM(search_term) <> ''
    GROUP BY LOWER(BTRIM(search_term))
    ORDER BY total DESC
    LIMIT 12
  ),
  top_courses AS (
    SELECT
      ew.course_id,
      COALESCE(c.titulo, MAX(ew.course_title), 'Curso sem titulo') AS course_title,
      COUNT(*)::int AS total_clicks,
      COUNT(DISTINCT ew.session_id)::int AS unique_sessions,
      COUNT(*) FILTER (WHERE ew.event_type = 'course_cta_click')::int AS cta_clicks
    FROM events_window ew
    LEFT JOIN public.cursos c ON c.id = ew.course_id
    WHERE ew.event_type IN ('course_click', 'course_cta_click')
    GROUP BY ew.course_id, c.titulo
    ORDER BY total_clicks DESC
    LIMIT 10
  ),
  top_referrers AS (
    SELECT
      COALESCE(NULLIF(SPLIT_PART(REGEXP_REPLACE(LOWER(referrer), '^https?://(www\\.)?', ''), '/', 1), ''), 'direto') AS referrer,
      COUNT(*)::int AS total
    FROM pageviews_window
    GROUP BY 1
    ORDER BY total DESC
    LIMIT 8
  ),
  daily AS (
    SELECT
      day::date,
      COUNT(p.id)::int AS pageviews,
      COUNT(DISTINCT p.session_id)::int AS sessions,
      COUNT(DISTINCT CASE WHEN fs.first_seen_all >= v_since AND p.created_at::date = day::date THEN p.session_id END)::int AS new_sessions,
      COUNT(e.id) FILTER (WHERE e.event_type = 'course_search')::int AS searches,
      COUNT(e.id) FILTER (WHERE e.event_type = 'course_click')::int AS course_clicks,
      COUNT(u.id)::int AS signups
    FROM generate_series(
      date_trunc('day', v_since),
      date_trunc('day', now()),
      interval '1 day'
    ) day
    LEFT JOIN public.marketing_pageviews p
      ON p.created_at::date = day::date
    LEFT JOIN first_seen_all fs
      ON fs.session_id = p.session_id
    LEFT JOIN public.marketing_events e
      ON e.created_at::date = day::date
    LEFT JOIN public.usuarios u
      ON u.criado_em::date = day::date
    GROUP BY day::date
    ORDER BY day::date ASC
  ),
  totals AS (
    SELECT
      COALESCE((SELECT COUNT(*)::int FROM pageviews_window), 0) AS pageviews,
      COALESCE((SELECT COUNT(*)::int FROM sessions_window), 0) AS sessions,
      COALESCE((SELECT COUNT(*)::int FROM sessions_labeled WHERE is_new), 0) AS new_sessions,
      COALESCE((SELECT COUNT(*)::int FROM sessions_labeled WHERE NOT is_new), 0) AS returning_sessions,
      COALESCE((SELECT AVG(pageviews)::numeric FROM sessions_labeled), 0) AS avg_pageviews_per_session,
      COALESCE((SELECT COUNT(*)::int FROM sessions_labeled WHERE pageviews = 1), 0) AS one_page_sessions,
      COALESCE((SELECT COUNT(*)::int FROM events_window WHERE event_type = 'course_search'), 0) AS searches,
      COALESCE((SELECT COUNT(*)::int FROM session_funnel WHERE has_search), 0) AS search_sessions,
      COALESCE((SELECT COUNT(*)::int FROM events_window WHERE event_type = 'course_search' AND result_count = 0), 0) AS search_no_result,
      COALESCE((SELECT COUNT(*)::int FROM events_window WHERE event_type = 'course_click'), 0) AS course_clicks,
      COALESCE((SELECT COUNT(*)::int FROM session_funnel WHERE has_course_click), 0) AS course_click_sessions,
      COALESCE((SELECT COUNT(*)::int FROM events_window WHERE event_type = 'course_cta_click'), 0) AS cta_clicks,
      COALESCE((SELECT COUNT(*)::int FROM events_window WHERE event_type = 'signup_success'), 0) AS signup_events,
      COALESCE((SELECT signups FROM signups_window), 0) AS cadastros
  )
  SELECT jsonb_build_object(
    'period_days', v_days,
    'window_start', v_since,
    'totals', jsonb_build_object(
      'pageviews', t.pageviews,
      'sessions', t.sessions,
      'new_sessions', t.new_sessions,
      'returning_sessions', t.returning_sessions,
      'avg_pageviews_per_session', ROUND(t.avg_pageviews_per_session, 2),
      'bounce_rate', CASE WHEN t.sessions = 0 THEN 0 ELSE ROUND((t.one_page_sessions::numeric * 100.0) / t.sessions, 2) END,
      'searches', t.searches,
      'search_sessions', t.search_sessions,
      'search_no_result', t.search_no_result,
      'search_no_result_rate', CASE WHEN t.searches = 0 THEN 0 ELSE ROUND((t.search_no_result::numeric * 100.0) / t.searches, 2) END,
      'course_clicks', t.course_clicks,
      'course_click_sessions', t.course_click_sessions,
      'cta_clicks', t.cta_clicks,
      'signup_events', t.signup_events,
      'cadastros', t.cadastros,
      'signup_conversion_rate', CASE WHEN t.new_sessions = 0 THEN 0 ELSE ROUND((t.cadastros::numeric * 100.0) / t.new_sessions, 2) END,
      'click_through_rate', CASE WHEN t.sessions = 0 THEN 0 ELSE ROUND((t.course_click_sessions::numeric * 100.0) / t.sessions, 2) END,
      'search_to_click_rate', CASE WHEN t.search_sessions = 0 THEN 0 ELSE ROUND((
        (SELECT COUNT(*)::numeric FROM session_funnel WHERE has_search AND has_course_click) * 100.0
      ) / t.search_sessions, 2) END,
      'avg_searches_per_search_session', CASE WHEN t.search_sessions = 0 THEN 0 ELSE ROUND(t.searches::numeric / t.search_sessions, 2) END
    ),
    'top_search_terms', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM top_search_terms s), '[]'::jsonb),
    'top_courses', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM top_courses c), '[]'::jsonb),
    'top_referrers', COALESCE((SELECT jsonb_agg(row_to_json(r)) FROM top_referrers r), '[]'::jsonb),
    'daily', COALESCE((SELECT jsonb_agg(row_to_json(d)) FROM daily d), '[]'::jsonb)
  ) INTO v_result
  FROM totals t;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_interest_metrics(integer) TO authenticated;
