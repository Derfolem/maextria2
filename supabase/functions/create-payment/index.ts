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

    const { cursoId, metodo } = await req.json();
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

    if (metodoSelecionado === "pix") {
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mpAccessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
      }

      const notificationUrl = Deno.env.get("MERCADOPAGO_WEBHOOK_URL");
      const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify({
          transaction_amount: precoCertificado,
          description: `Certificado - ${curso.titulo}`,
          payment_method_id: "pix",
          payer: { email: user.email },
          external_reference: `${cursoId}:${user.id}`,
          metadata: {
            curso_id: cursoId,
            usuario_id: user.id,
            preco: precoCertificado.toString(),
          },
          notification_url: notificationUrl || undefined,
        }),
      });

      if (!paymentResponse.ok) {
        const errorBody = await paymentResponse.text();
        throw new Error(`Mercado Pago error: ${errorBody}`);
      }

      const payment = await paymentResponse.json();
      const transactionData = payment?.point_of_interaction?.transaction_data || {};

      await supabaseAdmin.from("transacoes_pagamento").insert({
        usuario_id: user.id,
        curso_id: cursoId,
        valor: precoCertificado,
        status: "pendente",
        metodo_pagamento: "pix",
        mercado_pago_payment_id: payment.id?.toString(),
        mercado_pago_status: payment.status,
        pix_qr_code: transactionData.qr_code,
        pix_copia_e_cola: transactionData.qr_code,
        pix_qr_code_base64: transactionData.qr_code_base64,
        pix_ticket_url: transactionData.ticket_url,
      });

      return new Response(
        JSON.stringify({
          provider: "mercadopago",
          method: "pix",
          paymentId: payment.id?.toString(),
          qrCode: transactionData.qr_code,
          qrCodeBase64: transactionData.qr_code_base64,
          ticketUrl: transactionData.ticket_url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (metodoSelecionado === "mercadopago") {
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
      if (!mpAccessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
      }

      const notificationUrl = Deno.env.get("MERCADOPAGO_WEBHOOK_URL");
      const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify({
          items: [
            {
              title: `Certificado - ${curso.titulo}`,
              description: "Certificado digital de conclusão de curso",
              quantity: 1,
              unit_price: precoCertificado,
              currency_id: "BRL",
            },
          ],
          payer: { email: user.email },
          external_reference: `${cursoId}:${user.id}`,
          metadata: {
            curso_id: cursoId,
            usuario_id: user.id,
            preco: precoCertificado.toString(),
          },
          back_urls: {
            success: `${req.headers.get("origin")}/pagamento-certificado/${cursoId}?mp=success`,
            pending: `${req.headers.get("origin")}/pagamento-certificado/${cursoId}?mp=pending`,
            failure: `${req.headers.get("origin")}/pagamento-certificado/${cursoId}?mp=failure`,
          },
          auto_return: "approved",
          notification_url: notificationUrl || undefined,
        }),
      });

      if (!preferenceResponse.ok) {
        const errorBody = await preferenceResponse.text();
        throw new Error(`Mercado Pago error: ${errorBody}`);
      }

      const preference = await preferenceResponse.json();

      await supabaseAdmin.from("transacoes_pagamento").insert({
        usuario_id: user.id,
        curso_id: cursoId,
        valor: precoCertificado,
        status: "pendente",
        metodo_pagamento: "mercadopago",
        mercado_pago_preference_id: preference.id?.toString(),
      });

      return new Response(
        JSON.stringify({
          provider: "mercadopago",
          method: "checkout",
          url: preference.init_point,
          preferenceId: preference.id?.toString(),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
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

    // Create a one-time payment session for the certificate with dynamic price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: precoEmCentavos,
            product_data: {
              name: `Certificado - ${curso.titulo}`,
              description: "Certificado digital de conclusão de curso",
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pagamento-certificado/${cursoId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pagamento-certificado/${cursoId}?payment=canceled`,
      metadata: {
        curso_id: cursoId,
        usuario_id: user.id,
        preco: precoCertificado.toString(),
      },
    });

    // Log transaction as pending
    await supabaseAdmin.from("transacoes_pagamento").insert({
      usuario_id: user.id,
      curso_id: cursoId,
      valor: precoCertificado,
      status: "pendente",
      metodo_pagamento: "stripe",
      stripe_session_id: session.id,
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
