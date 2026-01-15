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
    const imageCostUsd = Number(Deno.env.get("AI_IMAGE_COST_USD") || "0.04");
    if (limitUsd > 0 && currentTotal + imageCostUsd > limitUsd) {
      return new Response(
        JSON.stringify({ error: "Limite mensal atingido." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro OpenAI:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisicoes excedido. Tente novamente." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
        );
      }
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Chave de API invalida ou sem permissao." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
        );
      }
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const first = data?.data?.[0];
    const base64 = first?.b64_json;
    const url = first?.url;
    if (!base64 && !url) {
      throw new Error("Nenhuma imagem foi gerada.");
    }

    let imageUrl = "";
    if (base64) {
      imageUrl = `data:image/png;base64,${base64}`;
    } else if (url) {
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        throw new Error("Falha ao baixar imagem gerada.");
      }
      const buffer = new Uint8Array(await imageResponse.arrayBuffer());
      let binary = "";
      for (const byte of buffer) {
        binary += String.fromCharCode(byte);
      }
      const encoded = btoa(binary);
      imageUrl = `data:image/png;base64,${encoded}`;
    }

    const newTotal = currentTotal + imageCostUsd;
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
      JSON.stringify({ imageUrl, cost_usd: imageCostUsd }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
