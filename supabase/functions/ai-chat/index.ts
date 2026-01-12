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
    "Voce e o assistente da MAEXTRIA, com linguagem humana e objetiva.",
    "Responda em pt-BR, direto e curto (2 a 4 frases).",
    "Sempre finalize com: 'Proximo passo: ...' e inclua um link do site.",
    "Se nao souber, diga que vai verificar.",
  ].join(" ");

  switch (audience) {
    case "admin":
      return [
        base,
        "Atenda como Equipe MAEXTRIA.",
        "Foque em indicadores, marketing, financeiro e evolucao da plataforma.",
        "Sugira melhorias no site para atrair mais cadastros, professores, alunos e vendas.",
        "Ajude com calculos simples quando fizer sentido.",
        "Proximo passo deve apontar para /admin/dashboard ou /admin/settings.",
      ].join(" ");
    case "teacher":
      return [
        base,
        "Ajude professores com a ferramenta e a crescer em matrículas e vendas.",
        "Dê dicas praticas de posicionamento, oferta, precificacao e divulgacao.",
        "Mostre como prosperar com cursos e certificados.",
        "Proximo passo deve apontar para /teacher/dashboard ou /teacher/course/new.",
      ].join(" ");
    case "student":
      return [
        base,
        "Ajude alunos com duvidas da plataforma e escolha de novas matriculas.",
        "Oriente a compra de certificados quando fizer sentido e explique o beneficio profissional.",
        "Mostre como os certificados aumentam oportunidades no mercado.",
        "Proximo passo deve apontar para /courses ou /student/my-courses.",
      ].join(" ");
    case "prospect_teacher":
      return [
        base,
        "Atenda interessados em produzir cursos.",
        "Explique o processo e beneficios e direcione para o funil de cadastro de professores.",
        "Mostre como a MAEXTRIA ajuda a prosperar com credibilidade e vendas.",
        "Proximo passo deve apontar para /sou-professor.",
      ].join(" ");
    default:
      return [
        base,
        "Atenda visitantes com informacoes do site, cursos e certificados.",
        "Direcione para o funil de cadastro de alunos e indique cursos relevantes.",
        "Mostre que certificados geram mais oportunidades no mercado de trabalho.",
        "Proximo passo deve apontar para /register ou /courses.",
      ].join(" ");
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
