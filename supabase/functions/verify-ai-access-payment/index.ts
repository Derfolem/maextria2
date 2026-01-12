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
    if (!usuarioId) {
      return new Response(JSON.stringify({ error: "Pagamento sem usuario" }), {
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
      .from("ai_course_payments")
      .update({
        status: "completo",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    const { data: existing } = await supabaseAdmin
      .from("ai_course_access")
      .select("id, granted_until, granted_by_admin")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    const now = new Date();
    const baseDate = existing?.granted_until
      ? new Date(existing.granted_until)
      : now;
    const effectiveBase = baseDate > now ? baseDate : now;
    const nextUntil = addDays(effectiveBase, 30);

    const payload = {
      usuario_id: usuarioId,
      granted_until: nextUntil.toISOString(),
      granted_by_admin: existing?.granted_by_admin ?? false,
      last_payment_intent_id: paymentIntent.id,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabaseAdmin.from("ai_course_access").update(payload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("ai_course_access").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, granted_until: nextUntil.toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in verify-ai-access-payment:", error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
