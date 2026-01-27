-- Add referral_id to transactions and harden commission creation

ALTER TABLE public.transacoes_pagamento
ADD COLUMN IF NOT EXISTS referral_id uuid REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_referral
  ON public.transacoes_pagamento (referral_id);

CREATE OR REPLACE FUNCTION public.commission_create_from_transaction(
  p_transacao_id uuid,
  p_certificado_id uuid,
  p_referral_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id uuid;
  v_rule_id uuid;
  v_rule_version integer;
  v_professor_id uuid;
  v_curso_id uuid;
  v_amount numeric(10,2);
  v_certificates integer;
  v_avg_rating numeric(5,2);
  v_completion_rate numeric(5,2);
  v_active_courses integer;
  v_tier_key text;
  v_base_pct numeric(5,2);
  v_bonus_pct numeric(5,2);
  v_commission_amount numeric(10,2);
  v_bonus_amount numeric(10,2);
  v_total_commission numeric(10,2);
  v_source_type text;
  v_referral_id uuid;
  v_referral_professor uuid;
BEGIN
  SELECT id INTO v_existing_id
  FROM public.commission_ledger
  WHERE transacao_id = p_transacao_id
     OR (p_certificado_id IS NOT NULL AND certificado_id = p_certificado_id)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  SELECT tp.curso_id, c.professor_id, tp.valor, tp.referral_id
    INTO v_curso_id, v_professor_id, v_amount, v_referral_id
  FROM public.transacoes_pagamento tp
  JOIN public.cursos c ON c.id = tp.curso_id
  WHERE tp.id = p_transacao_id;

  IF v_curso_id IS NULL OR v_professor_id IS NULL THEN
    RAISE EXCEPTION 'Transacao ou professor nao encontrado';
  END IF;

  IF p_referral_id IS NOT NULL THEN
    v_referral_id := p_referral_id;
  END IF;

  IF v_referral_id IS NOT NULL THEN
    SELECT l.professor_id
      INTO v_referral_professor
    FROM public.affiliate_referrals r
    JOIN public.affiliate_links l ON l.id = r.affiliate_link_id
    WHERE r.id = v_referral_id;

    IF v_referral_professor IS NULL OR v_referral_professor <> v_professor_id THEN
      v_referral_id := NULL;
    END IF;
  END IF;

  SELECT id, version INTO v_rule_id, v_rule_version
  FROM public.commission_rules
  WHERE is_active = true
  ORDER BY version DESC
  LIMIT 1;

  IF v_rule_id IS NULL THEN
    RAISE EXCEPTION 'Regra ativa de comissao nao encontrada';
  END IF;

  SELECT
    im.certificates_sold,
    im.avg_rating,
    im.completion_rate,
    im.active_courses
  INTO v_certificates, v_avg_rating, v_completion_rate, v_active_courses
  FROM public.instructor_metrics im
  WHERE im.professor_id = v_professor_id;

  IF v_certificates IS NULL THEN
    SELECT COALESCE(COUNT(*), 0)
      INTO v_certificates
    FROM public.certificados cert
    JOIN public.cursos c ON c.id = cert.curso_id
    WHERE cert.pago = true
      AND c.professor_id = v_professor_id;

    SELECT COALESCE(AVG(c.rating_medio), 0)
      INTO v_avg_rating
    FROM public.cursos c
    WHERE c.professor_id = v_professor_id;

    SELECT COALESCE(COUNT(*), 0)
      INTO v_active_courses
    FROM public.cursos c
    WHERE c.professor_id = v_professor_id
      AND c.ativo = true;

    v_completion_rate := 0;
  END IF;

  SELECT tier_key, base_pct
    INTO v_tier_key, v_base_pct
  FROM public.commission_pick_tier(
    v_rule_id,
    COALESCE(v_certificates, 0),
    COALESCE(v_avg_rating, 0),
    COALESCE(v_completion_rate, 0),
    COALESCE(v_active_courses, 0)
  );

  IF v_tier_key IS NULL THEN
    SELECT t.tier_key, t.base_pct
      INTO v_tier_key, v_base_pct
    FROM public.commission_tiers t
    WHERE t.rule_id = v_rule_id
    ORDER BY t.priority ASC
    LIMIT 1;
  END IF;

  v_source_type := CASE WHEN v_referral_id IS NULL THEN 'ORGANIC' ELSE 'AFFILIATE' END;
  v_bonus_pct := CASE WHEN v_referral_id IS NULL THEN 0 ELSE 10 END;

  v_commission_amount := ROUND((v_amount * v_base_pct) / 100.0, 2);
  v_bonus_amount := ROUND((v_amount * v_bonus_pct) / 100.0, 2);
  v_total_commission := v_commission_amount + v_bonus_amount;

  INSERT INTO public.commission_ledger (
    transacao_id,
    certificado_id,
    professor_id,
    curso_id,
    rule_version,
    tier_key,
    base_pct,
    affiliate_bonus_pct,
    commission_amount,
    commission_bonus_amount,
    total_commission,
    source_type,
    referral_id,
    status
  ) VALUES (
    p_transacao_id,
    p_certificado_id,
    v_professor_id,
    v_curso_id,
    v_rule_version,
    v_tier_key,
    v_base_pct,
    v_bonus_pct,
    v_commission_amount,
    v_bonus_amount,
    v_total_commission,
    v_source_type,
    v_referral_id,
    'OPEN'
  )
  RETURNING id INTO v_existing_id;

  RETURN v_existing_id;
END;
$$;
