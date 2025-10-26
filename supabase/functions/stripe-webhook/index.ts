import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

console.log("Stripe webhook handler loaded");

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");

  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`Received event: ${receivedEvent.type}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (receivedEvent.type) {
      case "checkout.session.completed": {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const cursoId = session.metadata?.curso_id;
        const usuarioId = session.metadata?.usuario_id;
        const preco = session.metadata?.preco;

        if (!cursoId || !usuarioId) {
          console.error("Missing metadata in session", session.metadata);
          break;
        }

        // Update transaction status
        const { error: updateError } = await supabaseAdmin
          .from("transacoes_pagamento")
          .update({
            status: "pago",
            stripe_payment_intent_id: session.payment_intent as string,
            atualizado_em: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        if (updateError) {
          console.error("Error updating transaction:", updateError);
        } else {
          console.log("Transaction updated successfully");
        }

        // Check if certificate already exists
        const { data: existingCert } = await supabaseAdmin
          .from("certificados")
          .select("id")
          .eq("usuario_id", usuarioId)
          .eq("curso_id", cursoId)
          .maybeSingle();

        if (!existingCert) {
          // Generate validation code
          const codigoValidacao = `MAEX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

          // Create certificate record
          const { error: certError } = await supabaseAdmin
            .from("certificados")
            .insert({
              usuario_id: usuarioId,
              curso_id: cursoId,
              pago: true,
              codigo_validacao: codigoValidacao,
              emitido_em: new Date().toISOString(),
            });

          if (certError) {
            console.error("Error creating certificate:", certError);
          } else {
            console.log("Certificate created successfully");
          }
        } else {
          // Update existing certificate to paid
          const { error: certUpdateError } = await supabaseAdmin
            .from("certificados")
            .update({ pago: true })
            .eq("id", existingCert.id);

          if (certUpdateError) {
            console.error("Error updating certificate:", certUpdateError);
          } else {
            console.log("Certificate updated to paid");
          }
        }

        break;
      }

      case "checkout.session.expired": {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        console.log("Checkout session expired:", session.id);

        // Update transaction status to expired
        const { error } = await supabaseAdmin
          .from("transacoes_pagamento")
          .update({
            status: "expirado",
            atualizado_em: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Error updating expired transaction:", error);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
