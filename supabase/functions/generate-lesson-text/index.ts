import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase env nao configurado");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token ausente" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Token invalido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const userId = authData.user.id;

    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt e obrigatorio" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY nao configurada");
    }

    const systemPrompt = [
      "Voce e um assistente para criacao de aulas.",
      "Responda de forma objetiva e direta.",
      "Limite maximo: 100 tokens.",
    ].join(" ");

    const now = new Date();
    let access = await supabase
      .from("ai_plan_access")
      .select("limit_usd, expires_at, status")
      .eq("usuario_id", userId)
      .maybeSingle();

    if (!access.data?.expires_at || access.data?.status !== "active") {
      const legacy = await supabase
        .from("ai_course_access")
        .select("granted_until")
        .eq("usuario_id", userId)
        .maybeSingle();
      if (!legacy.data?.granted_until) {
        return new Response(
          JSON.stringify({ error: "Plano IA nao ativo." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      access = {
        data: {
          limit_usd: Number(Deno.env.get("AI_MONTHLY_LIMIT_USD") || "5"),
          expires_at: legacy.data.granted_until,
          status: "active",
        },
        error: null,
      };
    }

    const expiresAt = new Date(access.data.expires_at);
    if (expiresAt <= now) {
      await supabase
        .from("ai_plan_access")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("usuario_id", userId);
      return new Response(
        JSON.stringify({ error: "Plano IA expirado." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: limitOverride } = await supabase
      .from("ai_usage_limits")
      .select("limit_usd")
      .eq("usuario_id", userId)
      .maybeSingle();
    const limitUsd = Number(limitOverride?.limit_usd ?? access.data.limit_usd ?? 0);
    const { data: usageRow } = await supabase
      .from("ai_usage_periods")
      .select("id, total_usd, period_start")
      .eq("usuario_id", userId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    const currentTotal = Number(usageRow?.total_usd ?? 0);
    if (limitUsd > 0 && currentTotal >= limitUsd) {
      return new Response(
        JSON.stringify({ error: "Limite mensal atingido." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave de API invalida ou sem permissao." }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("Nenhum texto foi gerado.");
    }

    const usage = data?.usage || {};
    const promptTokens = Number(usage.prompt_tokens ?? 0);
    const completionTokens = Number(usage.completion_tokens ?? 0);
    const inputCostPer1M = Number(Deno.env.get("AI_TEXT_INPUT_COST_PER_1M") || "0.15");
    const outputCostPer1M = Number(Deno.env.get("AI_TEXT_OUTPUT_COST_PER_1M") || "0.60");
    const costUsd = ((promptTokens * inputCostPer1M) + (completionTokens * outputCostPer1M)) / 1_000_000;

    const newTotal = currentTotal + costUsd;
    if (usageRow?.id) {
      await supabase
        .from("ai_usage_periods")
        .update({ total_usd: newTotal, updated_at: new Date().toISOString() })
        .eq("id", usageRow.id);
    } else {
      await supabase
        .from("ai_usage_periods")
        .insert({
          usuario_id: userId,
          period_start: now.toISOString(),
          period_end: expiresAt.toISOString(),
          total_usd: newTotal,
        });
    }

    return new Response(
      JSON.stringify({ text, cost_usd: costUsd }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
