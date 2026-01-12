import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const buildSystemPrompt = (audience: string) => {
  const base = [
    "Voce e o assistente da MAEXTRIA.",
    "Responda em pt-BR, direto e curto (2 a 4 frases).",
    "Se nao souber, diga que vai verificar.",
  ].join(" ");

  switch (audience) {
    case "admin":
      return `${base} Atenda como Equipe MAEXTRIA e foque em operacao, marketing e configuracoes internas.`;
    case "teacher":
      return `${base} Ajude professores a gerir cursos, alunos e mensagens, com orientacoes praticas.`;
    case "student":
      return `${base} Ajude alunos com cursos, certificados, pagamentos e uso da plataforma.`;
    case "prospect_teacher":
      return `${base} Atenda interessados em produzir cursos e explique o processo e beneficios.`;
    default:
      return `${base} Atenda visitantes interessados em cursos, plataforma e certificados.`;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history, audience } = await req.json();
    const trimmed = (message || "").toString().trim();
    if (!trimmed) {
      return new Response(
        JSON.stringify({ error: "Mensagem vazia." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY nao configurada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt((audience || "").toString());
    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((item) => item && typeof item.content === "string")
          .slice(-8)
          .map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: item.content.toString(),
          }))
      : [];

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        ...safeHistory,
        { role: "user", content: trimmed },
      ],
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({ error: errorBody }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "Nao consegui responder agora.";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado no chat." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
