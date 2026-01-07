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
    const { codigo } = await req.json();
    const codigoNormalizado = String(codigo || "").trim().toUpperCase();

    if (!codigoNormalizado) {
      return new Response(JSON.stringify({ error: "Código de validação é obrigatório" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const { data: certificado, error: certError } = await supabaseAdmin
      .from("certificados")
      .select("codigo_validacao, emitido_em, pago, usuario_id, cursos(titulo, carga_horaria_horas)")
      .eq("codigo_validacao", codigoNormalizado)
      .maybeSingle();

    if (certError || !certificado) {
      return new Response(JSON.stringify({ valid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("nome_completo")
      .eq("id", certificado.usuario_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        valid: true,
        certificado: {
          codigo_validacao: certificado.codigo_validacao,
          emitido_em: certificado.emitido_em,
          pago: certificado.pago,
          curso_titulo: certificado.cursos?.titulo ?? null,
          carga_horaria_horas: certificado.cursos?.carga_horaria_horas ?? null,
          nome_completo: usuario?.nome_completo ?? null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-certificate:", error);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
