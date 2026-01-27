-- Commission system v2 (rules, tiers, ledger, affiliates, payouts)

-- 1) Commission rules (versioned)
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_commission_rules_active
  ON public.commission_rules (is_active)
  WHERE is_active = true;

-- 2) Commission tiers
CREATE TABLE IF NOT EXISTS public.commission_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.commission_rules(id) ON DELETE CASCADE,
  tier_key text NOT NULL,
  label text NOT NULL,
  base_pct numeric(5,2) NOT NULL,
  min_certificates integer NOT NULL DEFAULT 0,
  max_certificates integer,
  min_rating numeric(3,2),
  min_completion_rate numeric(5,2),
  min_courses_active integer,
  priority integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(rule_id, tier_key)
);

-- 3) Metrics tables (snapshots by window)
CREATE TABLE IF NOT EXISTS public.course_metrics (
  course_id uuid PRIMARY KEY REFERENCES public.cursos(id) ON DELETE CASCADE,
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start date NOT NULL,
  window_end date NOT NULL,
  certificates_sold integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  completion_rate numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_metrics_professor
  ON public.course_metrics (professor_id);

CREATE TABLE IF NOT EXISTS public.instructor_metrics (
  professor_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start date NOT NULL,
  window_end date NOT NULL,
  certificates_sold integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  completion_rate numeric(5,2) NOT NULL DEFAULT 0,
  active_courses integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Affiliate links and referrals
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_professor
  ON public.affiliate_links (professor_id);

CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  click_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_link
  ON public.affiliate_referrals (affiliate_link_id);

-- 5) Commission ledger (immutable snapshot at purchase time)
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id uuid REFERENCES public.transacoes_pagamento(id) ON DELETE SET NULL,
  certificado_id uuid REFERENCES public.certificados(id) ON DELETE SET NULL,
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  curso_id uuid NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  rule_version integer NOT NULL,
  tier_key text NOT NULL,
  base_pct numeric(5,2) NOT NULL,
  affiliate_bonus_pct numeric(5,2) NOT NULL DEFAULT 0,
  commission_amount numeric(10,2) NOT NULL,
  commission_bonus_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_commission numeric(10,2) NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('ORGANIC', 'AFFILIATE')),
  referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PAID', 'REVERSED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_professor
  ON public.commission_ledger (professor_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_status
  ON public.commission_ledger (status);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_created_at
  ON public.commission_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_course
  ON public.commission_ledger (curso_id);

-- 6) Manual payouts and payout items
CREATE TABLE IF NOT EXISTS public.manual_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  paid_at timestamptz NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manual_payouts_professor
  ON public.manual_payouts (professor_id);

CREATE TABLE IF NOT EXISTS public.payout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id uuid NOT NULL REFERENCES public.manual_payouts(id) ON DELETE CASCADE,
  ledger_id uuid NOT NULL REFERENCES public.commission_ledger(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(payout_id, ledger_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_items_payout
  ON public.payout_items (payout_id);

-- 7) Refunds log (optional, for audit)
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transacao_id uuid NOT NULL REFERENCES public.transacoes_pagamento(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  refunded_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies: commission_rules
CREATE POLICY "Rules: admins manage"
  ON public.commission_rules
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Rules: authenticated read active"
  ON public.commission_rules
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- RLS policies: commission_tiers
CREATE POLICY "Tiers: admins manage"
  ON public.commission_tiers
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Tiers: read active rules"
  ON public.commission_tiers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.commission_rules r
      WHERE r.id = commission_tiers.rule_id AND r.is_active = true
    )
    AND auth.uid() IS NOT NULL
  );

-- RLS policies: course_metrics
CREATE POLICY "Course metrics: professor read own"
  ON public.course_metrics
  FOR SELECT
  USING (auth.uid() = professor_id);

CREATE POLICY "Course metrics: admins read"
  ON public.course_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Course metrics: system write"
  ON public.course_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Course metrics: system update"
  ON public.course_metrics
  FOR UPDATE
  USING (true);

-- RLS policies: instructor_metrics
CREATE POLICY "Instructor metrics: professor read own"
  ON public.instructor_metrics
  FOR SELECT
  USING (auth.uid() = professor_id);

CREATE POLICY "Instructor metrics: admins read"
  ON public.instructor_metrics
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Instructor metrics: system write"
  ON public.instructor_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Instructor metrics: system update"
  ON public.instructor_metrics
  FOR UPDATE
  USING (true);

-- RLS policies: affiliate_links
CREATE POLICY "Affiliate links: professor manage own"
  ON public.affiliate_links
  FOR ALL
  USING (auth.uid() = professor_id)
  WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Affiliate links: admins read"
  ON public.affiliate_links
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: affiliate_referrals
CREATE POLICY "Affiliate referrals: system insert"
  ON public.affiliate_referrals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Affiliate referrals: professor read own"
  ON public.affiliate_referrals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_links l
      WHERE l.id = affiliate_referrals.affiliate_link_id
        AND l.professor_id = auth.uid()
    )
  );

CREATE POLICY "Affiliate referrals: admins read"
  ON public.affiliate_referrals
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: commission_ledger
CREATE POLICY "Commission ledger: professor read own"
  ON public.commission_ledger
  FOR SELECT
  USING (auth.uid() = professor_id);

CREATE POLICY "Commission ledger: admins read"
  ON public.commission_ledger
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Commission ledger: system insert"
  ON public.commission_ledger
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Commission ledger: admins update"
  ON public.commission_ledger
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: manual_payouts
CREATE POLICY "Manual payouts: professor read own"
  ON public.manual_payouts
  FOR SELECT
  USING (auth.uid() = professor_id);

CREATE POLICY "Manual payouts: admins manage"
  ON public.manual_payouts
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: payout_items
CREATE POLICY "Payout items: professor read own"
  ON public.payout_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manual_payouts p
      WHERE p.id = payout_items.payout_id
        AND p.professor_id = auth.uid()
    )
  );

CREATE POLICY "Payout items: admins manage"
  ON public.payout_items
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS policies: refunds
CREATE POLICY "Refunds: admins manage"
  ON public.refunds
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed rule v1 (commission tiers)
INSERT INTO public.commission_rules (version, name, is_active, notes)
VALUES (1, 'Regra v1 - Progressiva', true, 'Migracao inicial do modelo progressivo')
ON CONFLICT (version) DO NOTHING;

INSERT INTO public.commission_tiers (
  rule_id, tier_key, label, base_pct, min_certificates, max_certificates,
  min_rating, min_completion_rate, min_courses_active, priority
)
SELECT
  r.id, t.tier_key, t.label, t.base_pct, t.min_certificates, t.max_certificates,
  t.min_rating, t.min_completion_rate, t.min_courses_active, t.priority
FROM public.commission_rules r
JOIN (
  VALUES
    ('initial', 'Inicial', 30.00, 0, 50, NULL, NULL, NULL, 10),
    ('validated', 'Validado', 40.00, 50, 200, 4.30, NULL, NULL, 20),
    ('highlight', 'Destaque', 50.00, 201, NULL, 4.50, 60.00, NULL, 30),
    ('expert', 'Especialista', 60.00, 501, NULL, NULL, NULL, 2, 40)
) AS t(tier_key, label, base_pct, min_certificates, max_certificates,
       min_rating, min_completion_rate, min_courses_active, priority)
ON true
WHERE r.version = 1
ON CONFLICT DO NOTHING;
