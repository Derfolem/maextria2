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

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const nowInSaoPaulo = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Autenticacao necessaria" }), {
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
      return new Response(JSON.stringify({ error: "Usuario nao autenticado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: "PaymentIntent ID obrigatorio" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!paymentIntent) {
      return new Response(JSON.stringify({ error: "Pagamento nao encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const usuarioId = paymentIntent.metadata?.usuario_id;
    const planCode = paymentIntent.metadata?.plan_code;
    const creditUsd = Number(paymentIntent.metadata?.credit_usd ?? 0);
    if (!usuarioId || !planCode) {
      return new Response(JSON.stringify({ error: "Pagamento sem usuario ou plano" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (usuarioId !== user.id) {
      return new Response(JSON.stringify({ error: "Pagamento nao pertence ao usuario" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (paymentIntent.status !== "succeeded") {
      return new Response(JSON.stringify({ error: "Pagamento ainda nao confirmado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin
      .from("ai_plan_payments")
      .update({
        status: "completo",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    const now = nowInSaoPaulo();
    const expiresAt = addDays(now, 30);

    const accessPayload = {
      usuario_id: usuarioId,
      plan_code: planCode,
      limit_usd: creditUsd,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      last_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    };

    const { data: existingAccess } = await supabaseAdmin
      .from("ai_plan_access")
      .select("id")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (existingAccess?.id) {
      await supabaseAdmin.from("ai_plan_access").update(accessPayload).eq("id", existingAccess.id);
    } else {
      await supabaseAdmin.from("ai_plan_access").insert(accessPayload);
    }

    await supabaseAdmin
      .from("ai_usage_limits")
      .upsert(
        { usuario_id: usuarioId, limit_usd: creditUsd, atualizado_em: new Date().toISOString() },
        { onConflict: "usuario_id" }
      );

    await supabaseAdmin
      .from("ai_usage_periods")
      .insert({
        usuario_id: usuarioId,
        period_start: now.toISOString(),
        period_end: expiresAt.toISOString(),
        total_usd: 0,
      });

    return new Response(
      JSON.stringify({ success: true, expires_at: expiresAt.toISOString(), plan_code: planCode }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in verify-ai-plan-payment:", error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
