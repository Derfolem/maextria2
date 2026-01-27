import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { cursoId, metodo, referralId } = await req.json();
    if (!cursoId) throw new Error("Course ID is required");

    console.log("Creating payment for user:", user.email, "course:", cursoId);

    // Fetch course to get certificate price
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const { data: curso, error: cursoError } = await supabaseAdmin
      .from("cursos")
      .select("titulo, preco_certificado")
      .eq("id", cursoId)
      .single();

    if (cursoError || !curso) {
      throw new Error("Course not found");
    }

    const precoCertificado = curso.preco_certificado || 39.00;
    const precoEmCentavos = Math.round(precoCertificado * 100);

    console.log("Certificate price:", precoCertificado, "BRL (", precoEmCentavos, "cents)");

    const metodoSelecionado = (metodo || "stripe").toString().toLowerCase();
    if (metodoSelecionado !== "stripe") {
      throw new Error("Método de pagamento não suportado");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2024-06-20",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: precoEmCentavos,
      currency: "brl",
      customer: customerId,
      receipt_email: user.email,
      description: `Certificado - ${curso.titulo}`,
      automatic_payment_methods: { enabled: true },
      metadata: {
        curso_id: cursoId,
        usuario_id: user.id,
        preco: precoCertificado.toString(),
        referral_id: referralId || '',
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe client secret not returned");
    }

    await supabaseAdmin.from("transacoes_pagamento").insert({
      usuario_id: user.id,
      curso_id: cursoId,
      valor: precoCertificado,
      status: "pendente",
      metodo_pagamento: "stripe",
      stripe_payment_intent_id: paymentIntent.id,
      referral_id: referralId || null,
    });

    console.log("PaymentIntent created:", paymentIntent.id);

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
    console.error("Error in create-payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
