-- ============================================================
-- Notificação Telegram para novos cadastros
-- ============================================================
-- ANTES DE APLICAR esta migration, execute no SQL Editor do Supabase:
--
--   ALTER DATABASE postgres SET app.supabase_url = 'https://SEU_PROJETO.supabase.co';
--   ALTER DATABASE postgres SET app.notify_secret = 'SEU_NOTIFY_WEBHOOK_SECRET';
--   SELECT pg_reload_conf();
--
-- Os valores ficam guardados no banco e o trigger os lê automaticamente.
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_telegram_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url    text;
  v_secret text;
BEGIN
  -- Lê a URL do projeto e o secret configurados no banco
  BEGIN
    v_url    := current_setting('app.supabase_url') || '/functions/v1/notify-telegram';
    v_secret := current_setting('app.notify_secret');
  EXCEPTION WHEN OTHERS THEN
    -- Não configurado ainda — segue sem notificar
    RETURN NEW;
  END;

  -- Chama a edge function via pg_net (assíncrono, não bloqueia o auth)
  PERFORM net.http_post(
    url     := v_url,
    body    := jsonb_build_object(
                 'type',       'new_user',
                 'id',         NEW.id::text,
                 'email',      NEW.email,
                 'created_at', NEW.created_at::text
               )::text,
    headers := jsonb_build_object(
                 'Content-Type',    'application/json',
                 'x-notify-secret', v_secret
               )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca quebra o fluxo de autenticação
  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS on_auth_user_created_telegram ON auth.users;

CREATE TRIGGER on_auth_user_created_telegram
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_telegram_on_signup();
