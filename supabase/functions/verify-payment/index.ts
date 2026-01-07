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

    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return new Response(JSON.stringify({ error: "Sessão de pagamento não encontrada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const cursoId = session.metadata?.curso_id;
    const usuarioId = session.metadata?.usuario_id;
    const preco = session.metadata?.preco;

    if (!cursoId || !usuarioId) {
      return new Response(JSON.stringify({ error: "Sessão sem metadados obrigatórios" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (usuarioId !== user.id) {
      return new Response(JSON.stringify({ error: "Sessão não pertence ao usuário" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Pagamento ainda não confirmado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin
      .from("transacoes_pagamento")
      .update({
        status: "completo",
        stripe_payment_intent_id: session.payment_intent as string,
        atualizado_em: new Date().toISOString(),
      })
      .eq("stripe_session_id", session.id);

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
