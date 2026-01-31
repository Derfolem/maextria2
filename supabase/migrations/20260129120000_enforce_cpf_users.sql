-- CPF validation and uniqueness for new users
CREATE OR REPLACE FUNCTION public.is_valid_cpf(cpf text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  digits text;
  i int;
  sum int;
  d1 int;
  d2 int;
BEGIN
  IF cpf IS NULL THEN
    RETURN false;
  END IF;

  digits := regexp_replace(cpf, '\D', '', 'g');
  IF length(digits) <> 11 THEN
    RETURN false;
  END IF;
  IF digits ~ '^(\d)\1{10}$' THEN
    RETURN false;
  END IF;

  sum := 0;
  FOR i IN 1..9 LOOP
    sum := sum + (cast(substr(digits, i, 1) as int) * (11 - i));
  END LOOP;
  d1 := CASE WHEN (sum % 11) < 2 THEN 0 ELSE 11 - (sum % 11) END;

  sum := 0;
  FOR i IN 1..10 LOOP
    sum := sum + (cast(substr(digits, i, 1) as int) * (12 - i));
  END LOOP;
  d2 := CASE WHEN (sum % 11) < 2 THEN 0 ELSE 11 - (sum % 11) END;

  RETURN substr(digits, 10, 1) = d1::text AND substr(digits, 11, 1) = d2::text;
END;
$$;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_cpf_valido CHECK (public.is_valid_cpf(cpf)) NOT VALID;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_cpf_unique
  ON public.usuarios (regexp_replace(cpf, '\D', '', 'g'))
  WHERE cpf IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome_completo, email, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data->>'cpf', ''), '\D', '', 'g'), '')
  );
  RETURN NEW;
END;
$$;
