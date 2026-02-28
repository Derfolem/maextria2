import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { sendTelegram } from "../_shared/telegram.ts";

/**
 * Edge Function: notify-telegram
 * Recebida por triggers pg_net do banco de dados (novos usuários).
 * Requer header x-notify-secret com o valor de NOTIFY_WEBHOOK_SECRET.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const secret = req.headers.get('x-notify-secret');
  const expected = Deno.env.get('NOTIFY_WEBHOOK_SECRET');

  if (!secret || !expected || secret !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    if (body.type === 'new_user') {
      await sendTelegram(
        `🆕 <b>Novo cadastro!</b>\n\n` +
        `✉️ ${body.email ?? 'sem email'}\n` +
        `📅 ${agora}`
      );
    }

    return new Response('OK', { status: 200 });
  } catch {
    return new Response('Error', { status: 500 });
  }
});
