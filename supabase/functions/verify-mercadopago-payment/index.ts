import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { sendTelegram } from "../_shared/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const mapStatus = (status?: string) => {
  switch (status) {
    case "approved":
      return "completo";
    case "cancelled":
    case "rejected":
      return "cancelado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    default:
      return "pendente";
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticação necessária" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData.user;

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { paymentId } = await req.json();
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "Payment ID é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }

    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mpAccessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.text();
      throw new Error(`Mercado Pago error: ${errorBody}`);
    }

    const payment = await paymentResponse.json();
    const metadata = payment?.metadata || {};
    const externalReference = payment?.external_reference || "";
    const [cursoRef, usuarioRef] = externalReference.split(":");

    const cursoId = metadata.curso_id || cursoRef;
    const usuarioId = metadata.usuario_id || usuarioRef;
    const preco = metadata.preco || payment?.transaction_amount?.toString();

    if (!cursoId || !usuarioId) {
      return new Response(JSON.stringify({ error: "Pagamento sem metadados obrigatórios" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (usuarioId !== user.id) {
      return new Response(JSON.stringify({ error: "Pagamento não pertence ao usuário" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const mappedStatus = mapStatus(payment.status);
    const metodoPagamento = payment?.payment_method_id === "pix" ? "pix" : "mercadopago";

    if (mappedStatus !== "completo") {
      return new Response(
        JSON.stringify({ error: "Pagamento ainda não confirmado", status: payment.status }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existingTransaction } = await supabaseAdmin
      .from("transacoes_pagamento")
      .select("id")
      .eq("mercado_pago_payment_id", payment.id?.toString())
      .maybeSingle();

    if (existingTransaction) {
      await supabaseAdmin
        .from("transacoes_pagamento")
        .update({
          status: mappedStatus,
          mercado_pago_payment_id: payment.id?.toString(),
          mercado_pago_status: payment.status,
          metodo_pagamento: metodoPagamento,
          atualizado_em: new Date().toISOString(),
        })
        .eq("mercado_pago_payment_id", payment.id?.toString());
    } else {
      await supabaseAdmin.from("transacoes_pagamento").insert({
        usuario_id: usuarioId,
        curso_id: cursoId,
        valor: Number(preco || 0),
        status: mappedStatus,
        metodo_pagamento: metodoPagamento,
        mercado_pago_payment_id: payment.id?.toString(),
        mercado_pago_status: payment.status,
      });
    }

    const { data: existingCert } = await supabaseAdmin
      .from("certificados")
      .select("id, pago")
      .eq("usuario_id", usuarioId)
      .eq("curso_id", cursoId)
      .maybeSingle();

    if (!existingCert) {
      const codigoValidacao = `MAEX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      await supabaseAdmin
        .from("certificados")
        .insert({
          usuario_id: usuarioId,
          curso_id: cursoId,
          pago: true,
          codigo_validacao: codigoValidacao,
          emitido_em: new Date().toISOString(),
        });
    } else if (!existingCert.pago) {
      await supabaseAdmin
        .from("certificados")
        .update({ pago: true })
        .eq("id", existingCert.id);
    }

    const { data: transacao } = await supabaseAdmin
      .from("transacoes_pagamento")
      .select("id, referral_id")
      .eq("mercado_pago_payment_id", payment.id?.toString())
      .maybeSingle();

    if (transacao?.id) {
      const { data: certRow } = await supabaseAdmin
        .from("certificados")
        .select("id")
        .eq("usuario_id", usuarioId)
        .eq("curso_id", cursoId)
        .maybeSingle();

      if (certRow?.id) {
        await supabaseAdmin.rpc("commission_create_from_transaction", {
          p_transacao_id: transacao.id,
          p_certificado_id: certRow.id,
          p_referral_id: transacao.referral_id ?? null,
        });
      }
    }

    // Notificação Telegram — nova compra via MercadoPago/PIX
    try {
      const { data: curso } = await supabaseAdmin
        .from("cursos")
        .select("titulo")
        .eq("id", cursoId)
        .maybeSingle();
      const valorFormatado = preco
        ? `R$ ${Number(preco).toFixed(2).replace(".", ",")}`
        : "";
      const agora = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
      await sendTelegram(
        `💰 <b>Nova compra de certificado!</b>\n\n` +
          `✉️ ${user.email}\n` +
          `📚 ${curso?.titulo ?? cursoId}\n` +
          `${valorFormatado ? `💵 ${valorFormatado}\n` : ""}` +
          `🔑 ${metodoPagamento === "pix" ? "PIX" : "MercadoPago"}\n` +
          `📅 ${agora}`
      );
    } catch {
      // Falha silenciosa
    }

    return new Response(JSON.stringify({ success: true, preco }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in verify-mercadopago-payment:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
