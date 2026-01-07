import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
  try {
    const bodyText = await req.text();
    const body = bodyText ? JSON.parse(bodyText) : {};
    const paymentId = body?.data?.id || body?.id || new URL(req.url).searchParams.get("id");

    if (!paymentId) {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!mpAccessToken) {
      console.error("Missing MERCADOPAGO_ACCESS_TOKEN");
      return new Response("Access token not configured", { status: 500 });
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
      console.error("Mercado Pago error:", errorBody);
      return new Response("Failed to fetch payment", { status: 400 });
    }

    const payment = await paymentResponse.json();
    const metadata = payment?.metadata || {};
    const externalReference = payment?.external_reference || "";
    const [cursoRef, usuarioRef] = externalReference.split(":");

    const cursoId = metadata.curso_id || cursoRef;
    const usuarioId = metadata.usuario_id || usuarioRef;
    const preco = metadata.preco || payment?.transaction_amount?.toString();
    const mappedStatus = mapStatus(payment.status);
    const metodoPagamento = payment?.payment_method_id === "pix" ? "pix" : "mercadopago";

    if (!cursoId || !usuarioId) {
      console.error("Missing metadata in Mercado Pago payment", payment.id);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
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

    if (mappedStatus === "completo") {
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
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Mercado Pago webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
