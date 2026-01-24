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

    // === SISTEMA DE COMISSOES ===
    // Buscar dados do curso (professor e preco)
    const { data: cursoData } = await supabaseAdmin
      .from("cursos")
      .select("professor_id, preco_certificado")
      .eq("id", cursoId)
      .single();

    if (cursoData?.professor_id) {
      // Buscar percentual de comissao configurado pelo admin
      const { data: configData } = await supabaseAdmin
        .from("configuracoes_site")
        .select("valor")
        .eq("chave", "admin_profit_share")
        .maybeSingle();

      // admin_profit_share e o percentual que FICA com o admin (ex: 30 = admin fica 30%, professor 70%)
      const adminShare = Number(configData?.valor ?? 30);
      const professorShare = 100 - adminShare;

      // Valor da venda
      const valorVenda = cursoData.preco_certificado ?? (preco ? Number(preco) : 39);

      // Calcular comissao do professor
      const valorComissao = (valorVenda * professorShare) / 100;

      // Buscar transacao_id
      let transacaoId: string | undefined;
      if (stripePaymentIntentId) {
        const { data: transacao } = await supabaseAdmin
          .from("transacoes_pagamento")
          .select("id")
          .eq("stripe_payment_intent_id", stripePaymentIntentId)
          .maybeSingle();
        transacaoId = transacao?.id;
      }

      // Verificar se ja existe comissao para esta transacao (evitar duplicatas)
      const { data: existingComissao } = await supabaseAdmin
        .from("comissoes_professores")
        .select("id")
        .eq("certificado_id", certificadoId)
        .maybeSingle();

      if (!existingComissao) {
        // Criar registro de comissao
        await supabaseAdmin
          .from("comissoes_professores")
          .insert({
            professor_id: cursoData.professor_id,
            curso_id: cursoId,
            certificado_id: certificadoId,
            transacao_id: transacaoId,
            valor_venda: valorVenda,
            percentual_professor: professorShare,
            valor_comissao: valorComissao,
            status: "pendente",
          });
      }
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
