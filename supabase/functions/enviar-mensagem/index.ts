import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email, assunto, mensagem, usuarioId } = await req.json();

    console.log("Recebendo mensagem de:", email);

    if (!nome || !email || !assunto || !mensagem) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Inserir mensagem na tabela
    const { error: insertError } = await supabaseAdmin
      .from("mensagens")
      .insert({
        remetente_id: usuarioId || null,
        remetente_nome: nome,
        remetente_email: email,
        assunto: assunto,
        mensagem: mensagem,
        status: "nao_lida",
      });

    if (insertError) {
      console.error("Erro ao inserir mensagem:", insertError);
      throw insertError;
    }

    console.log("Mensagem inserida com sucesso");

    return new Response(
      JSON.stringify({ success: true, message: "Mensagem enviada com sucesso" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro em enviar-mensagem:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});