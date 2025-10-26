import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Validar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    // 2. Validar entrada
    const body = await req.json();
    const { cursoId, certificadoId } = body;
    
    if (!cursoId || !certificadoId) {
      return new Response(
        JSON.stringify({ error: "Dados insuficientes para gerar certificado." }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log("Generating certificate for user:", user.id, "course:", cursoId);

    // 3. Buscar certificado e validar
    const { data: certificado, error: certError } = await supabaseClient
      .from("certificados")
      .select(`
        *,
        cursos(titulo, carga_horaria_horas)
      `)
      .eq("id", certificadoId)
      .eq("usuario_id", user.id)
      .single();

    if (certError || !certificado) {
      return new Response(
        JSON.stringify({ error: "Certificado não encontrado ou não autorizado" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // 4. Validar pagamento
    if (!certificado.pago) {
      return new Response(
        JSON.stringify({ 
          error: "Pagamento do certificado não identificado. Conclua a compra para baixar o PDF." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }

    // 5. Validar aprovação na prova (≥60%)
    const { data: provaResultado, error: provaError } = await supabaseClient
      .from("prova_resultado")
      .select("percentual, aprovado")
      .eq("usuario_id", user.id)
      .eq("curso_id", cursoId)
      .single();

    if (provaError || !provaResultado || !provaResultado.aprovado || provaResultado.percentual < 60) {
      return new Response(
        JSON.stringify({ 
          error: "Você precisa atingir pelo menos 60% na prova para emitir o certificado." 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }

    // 6. Buscar dados do usuário
    const { data: usuario } = await supabaseClient
      .from("usuarios")
      .select("nome_completo, cpf")
      .eq("id", user.id)
      .single();

    if (!usuario) {
      return new Response(
        JSON.stringify({ error: "Dados do usuário não encontrados" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404 
        }
      );
    }

    // 7. Gerar PDF do certificado
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    // Border
    doc.setDrawColor(40, 70, 150);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Logo/Title area - MAEXTRIA
    doc.setFillColor(10, 10, 26); // #0A0A1A
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    
    // MAEXTRIA com destaque no X
    const text = "MAEXTRIA";
    const textWidth = doc.getTextWidth(text);
    const startX = (pageWidth - textWidth) / 2;
    
    doc.text("MAE", startX, 25);
    doc.setTextColor(107, 78, 255); // #6B4EFF - roxo vibrante
    doc.text("X", startX + doc.getTextWidth("MAE"), 25);
    doc.setTextColor(255, 255, 255);
    doc.text("TRIA", startX + doc.getTextWidth("MAEX"), 25);

    // Certificate Title
    doc.setTextColor(107, 78, 255); // #6B4EFF
    doc.setFontSize(28);
    doc.text("CERTIFICADO DE CONCLUSÃO", pageWidth / 2, 60, { align: "center" });

    // Main text
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    
    const certifyText = "Certificamos que";
    doc.text(certifyText, pageWidth / 2, 80, { align: "center" });

    // Student name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 78, 255); // #6B4EFF
    doc.text(usuario.nome_completo.toUpperCase(), pageWidth / 2, 95, { align: "center" });

    // Course info
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    const conclusionText = `concluiu com êxito o curso de`;
    doc.text(conclusionText, pageWidth / 2, 110, { align: "center" });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 78, 255); // #6B4EFF
    doc.text(certificado.cursos.titulo.toUpperCase(), pageWidth / 2, 125, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const cargaHoraria = certificado.cursos.carga_horaria_horas || 0;
    doc.text(`Carga horária: ${cargaHoraria} horas`, pageWidth / 2, 137, { align: "center" });

    // Date
    const dataEmissao = new Date(certificado.emitido_em);
    const dataFormatada = dataEmissao.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    doc.text(`Emitido em ${dataFormatada}`, pageWidth / 2, 150, { align: "center" });

    // Validation code
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Código de validação: ${certificado.codigo_validacao}`, pageWidth / 2, 165, { align: "center" });

    // Legal information
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    
    const legalText = [
      "Certificação de cursos conforme Lei 9.394/96 e Decreto 5.154/04",
      "Nossos cursos são 100% on-line, de caráter livre, voltados para o aperfeiçoamento profissional e oferecidos em nível básico.",
      "Não se tratam de cursos de graduação, extensão universitária ou pós-graduação.",
      "O título do curso não equivale a uma formação profissional regulamentada, e sua certificação não autoriza o exercício",
      "de atividades que dependam de registro em conselhos ou órgãos fiscalizadores.",
      "Os cursos não possuem reconhecimento ou validação junto a órgãos como MEC, CONTRAN, DENATRAN, CIRETRAN, DETRAN,",
      "CETRAN, CONTRANDIFE, COFFITO, CRO, CRM, CFP, CREA, entre outros.",
      "A emissão do certificado está condicionada à aprovação na avaliação final e ao cumprimento de todos os requisitos",
      "previstos nos Termos de Uso da plataforma MAEXTRIA, incluindo a carga horária mínima de estudos.",
    ];

    let yPosition = pageHeight - 35;
    legalText.forEach((line) => {
      doc.text(line, pageWidth / 2, yPosition, { align: "center", maxWidth: pageWidth - 30 });
      yPosition += 3;
    });

    // 8. Gerar PDF como base64
    const pdfBase64 = doc.output("datauristring");

    console.log("Certificate PDF generated successfully for user:", user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfBase64,
        message: "Certificado gerado com sucesso" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "Falha interna ao gerar o certificado";
    const errorDetail = error instanceof Error ? error.stack : String(error);
    
    console.error("Error detail:", errorDetail);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        detail: "Erro técnico no servidor. Tente novamente em instantes."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
