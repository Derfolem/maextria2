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
    "Voce e o assistente da MAEXTRIA, vendedor e amigavel.",
    "Responda em pt-BR, muito curto e objetivo.",
    "Foque apenas no contexto do site, cursos, tipos, carga horaria e certificados.",
    "Nao responda assuntos pessoais, pesquisa geral ou perguntas fora do site.",
    "Nao revele informacoes confidenciais, tecnicas, financeiras, marketing, nem dados de usuarios.",
    "Nao informe valores, planos, precos, ou numeros de cursos.",
    "Nao invente cursos, cargas horarias, certificados, politicas ou resultados.",
    "Nao diga que ha varios cursos ou muitas areas; nao afirme quantidade.",
    "Se precisar de dados reais, diga que nao tem acesso e direcione para a pagina correta.",
    "Sempre direcione para um proximo passo dentro do site com CTA em link.",
    "Formato do CTA: Proximo passo: <a href=\"/caminho\">clique aqui</a>.",
    "Se faltar informacao, faca 3 a 5 perguntas curtas para recomendar melhor.",
    "Se o usuario pedir cursos, diga que nao tem acesso a lista em tempo real e direcione para /courses.",
    "Se nao souber, diga que nao tem acesso a dados em tempo real e ofereca um caminho.",
  ].join(" ");

  switch (audience) {
    case "admin":
      return [
        base,
        "Atenda como Equipe MAEXTRIA.",
        "Nao trate de marketing nem financeiro.",
        "Oriente sobre cursos, certificados e uso da plataforma.",
        "Proximo passo deve apontar para /admin/dashboard.",
      ].join(" ");
    case "teacher":
      return [
        base,
        "Atenda professores com foco em entrar na plataforma e publicar cursos.",
        "Conduza para o funil de cadastro e formulario de professor.",
        "Mostre beneficios de vender cursos e certificados.",
        "Proximo passo deve apontar para /sou-professor.",
      ].join(" ");
    case "student":
      return [
        base,
        "Ajude alunos a escolher cursos e a comprar certificados.",
        "Mostre que certificado aumenta oportunidades profissionais.",
        "Investigue trabalho atual, objetivos, area, experiencias e interesses.",
        "Sempre direcione para matricula e certificado.",
        "Proximo passo deve apontar para /courses.",
      ].join(" ");
    case "prospect_teacher":
      return [
        base,
        "Atenda interessados em produzir cursos.",
        "Direcione para o funil de cadastro de professores.",
        "Mostre como a MAEXTRIA ajuda a prosperar com credibilidade e vendas.",
        "Proximo passo deve apontar para /sou-professor.",
      ].join(" ");
    default:
      return [
        base,
        "Atenda visitantes com informacoes do site, cursos e certificados.",
        "Direcione para o funil de cadastro de alunos e indique cursos relevantes.",
        "Mostre que certificados geram mais oportunidades no mercado de trabalho.",
        "Investigue perfil profissional, objetivos e interesses para sugerir cursos.",
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
      temperature: 0.2,
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
