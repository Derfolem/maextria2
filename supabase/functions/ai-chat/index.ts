import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type CourseSummary = {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
};

type CourseListResponse = {
  content: string;
  courses?: CourseSummary[];
  matched?: boolean;
};

const normalizeInput = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const extractKeywords = (texts: string[]) => {
  const stopwords = new Set([
    "a", "o", "e", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
    "para", "por", "com", "sem", "um", "uma", "uns", "umas", "que", "qual", "quais",
    "tem", "tenho", "quero", "gostaria", "me", "meu", "minha", "meus", "minhas",
    "curso", "cursos", "area", "areas", "objetivo", "profissional", "atualizar",
    "atualizando", "indica", "indique", "recomenda", "recomende", "sugere", "sugestao",
  ]);
  const words = texts
    .flatMap((text) => normalizeInput(text).split(/[^a-z0-9]+/g))
    .filter((word) => word && word.length > 2 && !stopwords.has(word));
  return Array.from(new Set(words));
};

const scoreCourse = (course: CourseSummary, keywords: string[]) => {
  if (keywords.length === 0) return 0;
  const haystack = normalizeInput(
    [course.titulo, course.descricao, course.categoria].filter(Boolean).join(" ")
  );
  return keywords.reduce((score, keyword) => (
    haystack.includes(keyword) ? score + 1 : score
  ), 0);
};

const getCourseIntent = (message: string, history: ChatMessage[]) => {
  const normalized = normalizeInput(message);
  const triggers = [
    "quais cursos",
    "que cursos",
    "lista de cursos",
    "catalogo",
    "catalogo de cursos",
    "cursos disponiveis",
    "cursos disponiveis",
    "cursos vc tem",
    "cursos voce tem",
    "cursos tem",
    "quais sao os cursos",
    "quais sao",
    "vc tem",
    "voce tem",
    "tem curso",
  ];
  if (triggers.some((trigger) => normalized.includes(trigger))) {
    return "list";
  }

  const wantsRecommendation = [
    "me indica",
    "me recomend",
    "recomenda",
    "indica",
    "sugere",
    "sugestao",
  ].some((trigger) => normalized.includes(trigger));
  if (wantsRecommendation) {
    return "recommend";
  }

  if (normalized.includes("curso")) {
    return "list";
  }

  const historyMentionsCourse = history
    .filter((item) => item.role === "user")
    .slice(-4)
    .some((item) => normalizeInput(item.content).includes("curso"));
  return historyMentionsCourse ? "list" : null;
};

const buildCourseListResponse = async (
  keywords: string[] = [],
  limit?: number
): Promise<CourseListResponse> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_ANON_PUBLIC_KEY") ??
    "";

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      content: "Nao consigo acessar o catalogo agora. Proximo passo: clique aqui /courses.",
    };
  }

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabaseClient
    .from("cursos")
    .select("id, titulo, descricao, categoria")
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar cursos:", error);
    return {
      content: "Nao consegui listar os cursos agora. Proximo passo: clique aqui /courses.",
    };
  }

  const courses = (data || []).filter(
    (course): course is CourseSummary =>
      Boolean(course?.id) && Boolean(course?.titulo)
  );

  if (courses.length === 0) {
    return {
      content: "Ainda nao ha cursos publicados. Proximo passo: clique aqui /courses.",
    };
  }

  const ranked = keywords.length > 0
    ? [...courses]
        .map((course) => ({ course, score: scoreCourse(course, keywords) }))
        .sort((a, b) => b.score - a.score)
    : courses.map((course) => ({ course, score: 0 }));
  const best = ranked.filter((item) => item.score > 0).map((item) => item.course);
  const fallback = ranked.map((item) => item.course);
  const selected = (best.length > 0 ? best : fallback).slice(0, limit ?? fallback.length);

  const header = selected.length === 1
    ? "Curso disponivel agora:"
    : "Cursos disponiveis agora:";

  return {
    content: header,
    courses: selected,
    matched: best.length > 0,
  };
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
    "Responda de forma humana e direta, sem parecer robo.",
    "Se precisar de dados reais, responda com o que foi fornecido pela plataforma.",
    "Nunca invente cursos.",
    "Evite perguntas demais: no maximo 2 perguntas curtas.",
    "Nao pergunte sobre modalidade presencial ou online.",
    "Se nao tiver curso da area pedida, diga isso e ofereca os cursos disponiveis.",
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

    const safeHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter((item) => item && typeof item.content === "string")
          .slice(-8)
          .map((item) => ({
            role: item.role === "assistant" ? "assistant" : "user",
            content: item.content.toString(),
          }))
      : [];

    const intent = getCourseIntent(trimmed, safeHistory);
    if (intent) {
      const historyTexts = safeHistory
        .filter((item) => item.role === "user")
        .map((item) => item.content);
      const keywords = extractKeywords([trimmed, ...historyTexts]);
      if (intent === "recommend" && keywords.length === 0) {
        const result = await buildCourseListResponse([], 3);
        return new Response(
          JSON.stringify({
            content: "Posso sugerir estes cursos agora:",
            courses: result.courses,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const priorUserTexts = safeHistory
        .filter((item) => item.role === "user")
        .map((item) => normalizeInput(item.content));
      const repeated = keywords.some((keyword) =>
        priorUserTexts.some((text) => text.includes(keyword))
      );

      const limit = intent === "recommend" ? 3 : undefined;
      const result = await buildCourseListResponse(keywords, limit);
      if (result.matched === false && keywords.length > 0) {
        if (keywords.length <= 2) {
          return new Response(
            JSON.stringify({
              content: "Nao entendi bem. Me diz seu objetivo ou area que voce quer melhorar?",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        if (repeated) {
          return new Response(
            JSON.stringify({
              content: "Ainda nao temos esse curso. Quer que eu te ajude a escolher algo parecido?",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
        return new Response(
          JSON.stringify({
            content: `Nao encontrei curso de ${keywords.join(", ")}. Quer que eu te ajude a escolher algo proximo?`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
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
