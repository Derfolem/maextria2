-- Fix function search_path mutable issue
-- Update update_marketing_updated_at function to set search_path
CREATE OR REPLACE FUNCTION public.update_marketing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$function$;