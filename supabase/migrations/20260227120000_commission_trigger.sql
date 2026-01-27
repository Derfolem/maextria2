-- Auto-create commission ledger when transaction becomes complete

CREATE OR REPLACE FUNCTION public.commission_after_payment_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completo' AND (OLD.status IS DISTINCT FROM 'completo') THEN
    PERFORM public.commission_create_from_transaction(NEW.id, NEW.certificado_id, NEW.referral_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_commission_after_payment_complete ON public.transacoes_pagamento;

CREATE TRIGGER trg_commission_after_payment_complete
AFTER UPDATE OF status ON public.transacoes_pagamento
FOR EACH ROW
EXECUTE FUNCTION public.commission_after_payment_complete();
