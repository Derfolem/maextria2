-- ============================================================
-- Notificação Telegram para novos cadastros
-- URL e secret ficam hardcoded na função (Supabase não permite ALTER DATABASE).
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_telegram_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Chama a edge function via pg_net (assíncrono, não bloqueia o auth)
  PERFORM net.http_post(
    url     := 'https://zcrwmdctwjqrvzbvfpuj.supabase.co/functions/v1/notify-telegram',
    body    := jsonb_build_object(
                 'type',       'new_user',
                 'id',         NEW.id::text,
                 'email',      NEW.email,
                 'created_at', NEW.created_at::text
               )::text,
    headers := jsonb_build_object(
                 'Content-Type',    'application/json',
                 'x-notify-secret', 'maex_notify_2026_xK9p'
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
