import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import pdf from "https://esm.sh/pdf-parse@1.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type UploadedFile = {
  path: string;
  name: string;
  type: string;
};

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractText = async (buffer: ArrayBuffer, type: string) => {
  if (type.includes("pdf")) {
    const data = await pdf(new Uint8Array(buffer));
    return data.text || "";
  }
  const text = new TextDecoder().decode(buffer);
  return stripHtml(text);
};

const buildPrompt = (content: string, userPrompt?: string) => [
  "Voce vai criar um curso para a MAEXTRIA.",
  "Use o conteudo abaixo como base e gere um JSON estrito.",
  "Se o conteudo nao tiver questionarios, deixe quiz vazio.",
  "Nao invente imagens; use thumbnail como string vazia.",
  "Responda apenas com JSON.",
  "Estrutura esperada:",
  "{",
  '  "course": { "title": "...", "description": "...", "category": "...", "level": "...", "price": 39, "slug": "...", "teacherName": "...", "thumbnail": "" },',
  '  "modules": [',
  '    { "title": "...", "description": "...", "lessons": [ { "title": "...", "content": "..." } ], "quiz": { "title": "...", "questions": [ { "question": "...", "options": ["a","b","c","d"], "correct": "a" } ] } }',
  "  ],",
  '  "finalQuiz": { "title": "...", "questions": [ { "question": "...", "options": ["a","b","c","d"], "correct": "a" } ] }',
  "}",
  userPrompt ? `Pedido extra do professor: ${userPrompt}` : "",
  "Conteudo:",
  content,
].join("\n");

const safeJsonParse = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Usuario nao autenticado." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { files, prompt } = await req.json();
    const list: UploadedFile[] = Array.isArray(files) ? files : [];
    if (list.length === 0) {
      return new Response(
        JSON.stringify({ error: "Envie ao menos um arquivo." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const bucket = "ai-ingest";
    const texts: string[] = [];

    for (const file of list) {
      const { data, error } = await admin.storage.from(bucket).download(file.path);
      if (error || !data) {
        throw new Error("Falha ao ler arquivo enviado.");
      }
      const buffer = await data.arrayBuffer();
      const text = await extractText(buffer, file.type || "");
      const label = file.name ? `Arquivo: ${file.name}` : "Arquivo";
      texts.push(`${label}\n${text}`);
      await admin.storage.from(bucket).remove([file.path]);
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY nao configurada." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const fullContent = texts.join("\n\n");
    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 1800,
      messages: [
        { role: "system", content: "Voce responde apenas JSON valido." },
        { role: "user", content: buildPrompt(fullContent, prompt) },
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
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = safeJsonParse(content);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Nao foi possivel interpretar o conteudo." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422 }
      );
    }

    return new Response(
      JSON.stringify({ data: parsed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro ao gerar curso com IA." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
