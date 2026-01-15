import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_CONFIG: Record<string, { amount_brl: number; credit_usd: number; label: string }> = {
  basic: { amount_brl: 9.9, credit_usd: 0.25, label: "Basico" },
  intermediate: { amount_brl: 17.9, credit_usd: 0.5, label: "Intermediario" },
  advanced: { amount_brl: 32.9, credit_usd: 1, label: "Avancado" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("Usuario nao autenticado.");
    }

    const { planCode } = await req.json();
    const plan = PLAN_CONFIG[String(planCode)];
    if (!plan) {
      return new Response(JSON.stringify({ error: "Plano invalido." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.amount_brl * 100),
      currency: "brl",
      receipt_email: user.email,
      description: `Plano IA ${plan.label} (30 dias)`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        usuario_id: user.id,
        tipo: "ai_plan",
        plan_code: planCode,
        credit_usd: plan.credit_usd.toString(),
        amount_brl: plan.amount_brl.toString(),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe client secret nao retornado.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("ai_plan_payments").insert({
      usuario_id: user.id,
      plan_code: planCode,
      amount_brl: plan.amount_brl,
      credit_usd: plan.credit_usd,
      status: "pendente",
      stripe_payment_intent_id: paymentIntent.id,
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in create-ai-plan-payment:", error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
