import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

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

    const { sessionId, paymentIntentId } = await req.json();
    if (!sessionId && !paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Session ID ou PaymentIntent ID é obrigatório" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    let cursoId: string | undefined;
    let usuarioId: string | undefined;
    let preco: string | undefined;
    let stripePaymentIntentId: string | undefined;
    let stripeSessionId: string | undefined;

    if (paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        return new Response(JSON.stringify({ error: "Pagamento não encontrado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      cursoId = paymentIntent.metadata?.curso_id;
      usuarioId = paymentIntent.metadata?.usuario_id;
      preco = paymentIntent.metadata?.preco;
      stripePaymentIntentId = paymentIntent.id;

      if (paymentIntent.status !== "succeeded") {
        return new Response(JSON.stringify({ error: "Pagamento ainda não confirmado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        });
      }
    } else if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (!session) {
        return new Response(JSON.stringify({ error: "Sessão de pagamento não encontrada" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }

      cursoId = session.metadata?.curso_id;
      usuarioId = session.metadata?.usuario_id;
      preco = session.metadata?.preco;
      stripePaymentIntentId = session.payment_intent as string | undefined;
      stripeSessionId = session.id;

      if (session.payment_status !== "paid") {
        return new Response(JSON.stringify({ error: "Pagamento ainda não confirmado" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        });
      }
    }

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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    if (stripePaymentIntentId || stripeSessionId) {
      const updateQuery = supabaseAdmin
        .from("transacoes_pagamento")
        .update({
          status: "completo",
          stripe_payment_intent_id: stripePaymentIntentId,
          atualizado_em: new Date().toISOString(),
        });

      if (stripePaymentIntentId) {
        await updateQuery.eq("stripe_payment_intent_id", stripePaymentIntentId);
      } else if (stripeSessionId) {
        await updateQuery.eq("stripe_session_id", stripeSessionId);
      }
    }

    const { data: existingCert } = await supabaseAdmin
      .from("certificados")
      .select("id, pago")
      .eq("usuario_id", usuarioId)
      .eq("curso_id", cursoId)
      .maybeSingle();

    let certificadoId: string | undefined;

    if (!existingCert) {
      const codigoValidacao = `MAEX-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const { data: newCert } = await supabaseAdmin
        .from("certificados")
        .insert({
          usuario_id: usuarioId,
          curso_id: cursoId,
          pago: true,
          codigo_validacao: codigoValidacao,
          emitido_em: new Date().toISOString(),
        })
        .select("id")
        .single();

      certificadoId = newCert?.id;
    } else if (!existingCert.pago) {
      await supabaseAdmin
        .from("certificados")
        .update({ pago: true })
        .eq("id", existingCert.id);

      certificadoId = existingCert.id;
    } else {
      // Certificado ja existe e ja esta pago - nao criar comissao duplicada
      return new Response(JSON.stringify({ success: true, preco }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // === SISTEMA DE COMISSOES (novo ledger) ===
    let transacaoId: string | undefined;
    let referralId: string | null = null;
    if (stripePaymentIntentId) {
      const { data: transacao } = await supabaseAdmin
        .from("transacoes_pagamento")
        .select("id, referral_id")
        .eq("stripe_payment_intent_id", stripePaymentIntentId)
        .maybeSingle();
      transacaoId = transacao?.id;
      referralId = transacao?.referral_id ?? null;
    } else if (stripeSessionId) {
      const { data: transacao } = await supabaseAdmin
        .from("transacoes_pagamento")
        .select("id, referral_id")
        .eq("stripe_session_id", stripeSessionId)
        .maybeSingle();
      transacaoId = transacao?.id;
      referralId = transacao?.referral_id ?? null;
    }

    if (transacaoId) {
      await supabaseAdmin.rpc("commission_create_from_transaction", {
        p_transacao_id: transacaoId,
        p_certificado_id: certificadoId,
        p_referral_id: referralId,
      });
    }

    return new Response(JSON.stringify({ success: true, preco }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in verify-payment:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
