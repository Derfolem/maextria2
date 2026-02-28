/**
 * Utilitário compartilhado para envio de mensagens via Telegram Bot.
 * Requer as variáveis de ambiente TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID.
 */
export async function sendTelegram(message: string): Promise<void> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch {
    // Falha silenciosa — notificação não deve impedir o fluxo principal
  }
}
