-- Commission system functions (RPC)

-- Helper: pick tier based on metrics
CREATE OR REPLACE FUNCTION public.commission_pick_tier(
  p_rule_id uuid,
  p_certificates integer,
  p_avg_rating numeric,
  p_completion_rate numeric,
  p_active_courses integer
)
RETURNS TABLE (tier_key text, base_pct numeric)
LANGUAGE sql
STABLE
AS $$
  SELECT t.tier_key, t.base_pct
  FROM public.commission_tiers t
  WHERE t.rule_id = p_rule_id
    AND p_certificates >= t.min_certificates
    AND (t.max_certificates IS NULL OR p_certificates <= t.max_certificates)
    AND (t.min_rating IS NULL OR p_avg_rating >= t.min_rating)
    AND (t.min_completion_rate IS NULL OR p_completion_rate >= t.min_completion_rate)
    AND (t.min_courses_active IS NULL OR p_active_courses >= t.min_courses_active)
  ORDER BY t.priority DESC
  LIMIT 1;
$$;

-- Create commission ledger for a transaction (idempotent)
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
BEGIN
  SELECT id INTO v_existing_id
  FROM public.commission_ledger
  WHERE transacao_id = p_transacao_id
     OR (p_certificado_id IS NOT NULL AND certificado_id = p_certificado_id)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  SELECT tp.curso_id, c.professor_id, tp.valor
    INTO v_curso_id, v_professor_id, v_amount
  FROM public.transacoes_pagamento tp
  JOIN public.cursos c ON c.id = tp.curso_id
  WHERE tp.id = p_transacao_id;

  IF v_curso_id IS NULL OR v_professor_id IS NULL THEN
    RAISE EXCEPTION 'Transacao ou professor nao encontrado';
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

  v_source_type := CASE WHEN p_referral_id IS NULL THEN 'ORGANIC' ELSE 'AFFILIATE' END;
  v_bonus_pct := CASE WHEN p_referral_id IS NULL THEN 0 ELSE 10 END;

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
    p_referral_id,
    'OPEN'
  )
  RETURNING id INTO v_existing_id;

  RETURN v_existing_id;
END;
$$;

-- Create manual payout and link ledger items
CREATE OR REPLACE FUNCTION public.commission_create_manual_payout(
  p_professor_id uuid,
  p_ledger_ids uuid[],
  p_paid_at timestamptz,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric(10,2);
  v_payout_id uuid;
BEGIN
  SELECT COALESCE(SUM(total_commission), 0)
    INTO v_total
  FROM public.commission_ledger
  WHERE id = ANY(p_ledger_ids)
    AND professor_id = p_professor_id
    AND status = 'OPEN';

  IF v_total <= 0 THEN
    RAISE EXCEPTION 'Nenhuma comissao aberta encontrada para pagamento';
  END IF;

  INSERT INTO public.manual_payouts (professor_id, amount, paid_at, note, created_by)
  VALUES (p_professor_id, v_total, p_paid_at, p_note, auth.uid())
  RETURNING id INTO v_payout_id;

  INSERT INTO public.payout_items (payout_id, ledger_id, amount)
  SELECT v_payout_id, id, total_commission
  FROM public.commission_ledger
  WHERE id = ANY(p_ledger_ids)
    AND professor_id = p_professor_id
    AND status = 'OPEN';

  UPDATE public.commission_ledger
  SET status = 'PAID'
  WHERE id = ANY(p_ledger_ids)
    AND professor_id = p_professor_id
    AND status = 'OPEN';

  RETURN v_payout_id;
END;
$$;

-- Generate or return active affiliate link for professor
CREATE OR REPLACE FUNCTION public.affiliate_get_or_create_link(
  p_professor_id uuid
)
RETURNS public.affiliate_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.affiliate_links;
  v_code text;
BEGIN
  SELECT * INTO v_link
  FROM public.affiliate_links
  WHERE professor_id = p_professor_id
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_link.id IS NOT NULL THEN
    RETURN v_link;
  END IF;

  v_code := substring(encode(gen_random_bytes(9), 'hex') for 10);

  INSERT INTO public.affiliate_links (professor_id, code, is_active)
  VALUES (p_professor_id, v_code, true)
  RETURNING * INTO v_link;

  RETURN v_link;
END;
$$;

-- Register affiliate click (returns referral id)
CREATE OR REPLACE FUNCTION public.affiliate_register_click(
  p_code text,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent_hash text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
  v_referral_id uuid;
BEGIN
  SELECT id INTO v_link_id
  FROM public.affiliate_links
  WHERE code = p_code
    AND is_active = true
  LIMIT 1;

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Link de afiliado invalido';
  END IF;

  INSERT INTO public.affiliate_referrals (
    affiliate_link_id,
    session_id,
    ip_hash,
    user_agent_hash
  ) VALUES (
    v_link_id,
    p_session_id,
    p_ip_hash,
    p_user_agent_hash
  ) RETURNING id INTO v_referral_id;

  UPDATE public.affiliate_links
  SET last_used_at = now()
  WHERE id = v_link_id;

  RETURN v_referral_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.commission_pick_tier(uuid, integer, numeric, numeric, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commission_create_from_transaction(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.commission_create_manual_payout(uuid, uuid[], timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_get_or_create_link(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.affiliate_register_click(text, text, text, text) TO authenticated;
