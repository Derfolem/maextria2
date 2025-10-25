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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { cursoId, certificadoId } = await req.json();
    if (!cursoId || !certificadoId) throw new Error("Course ID and Certificate ID are required");

    console.log("Generating certificate for user:", user.id, "course:", cursoId);

    // Fetch certificate data
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
      throw new Error("Certificate not found or not authorized");
    }

    // Fetch user data
    const { data: usuario } = await supabaseClient
      .from("usuarios")
      .select("nome_completo, cpf")
      .eq("id", user.id)
      .single();

    if (!usuario) throw new Error("User data not found");

    // Create PDF
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

    // Logo/Title area
    doc.setFillColor(40, 70, 150);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("EVOLUI CURSOS", pageWidth / 2, 25, { align: "center" });

    // Certificate Title
    doc.setTextColor(40, 70, 150);
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
    doc.setTextColor(40, 70, 150);
    doc.text(usuario.nome_completo.toUpperCase(), pageWidth / 2, 95, { align: "center" });

    // Course info
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    const conclusionText = `concluiu com êxito o curso de`;
    doc.text(conclusionText, pageWidth / 2, 110, { align: "center" });

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 70, 150);
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
      "previstos nos Termos de Uso da plataforma Evolui Cursos, incluindo a carga horária mínima de estudos.",
    ];

    let yPosition = pageHeight - 35;
    legalText.forEach((line) => {
      doc.text(line, pageWidth / 2, yPosition, { align: "center", maxWidth: pageWidth - 30 });
      yPosition += 3;
    });

    // Generate PDF as base64
    const pdfBase64 = doc.output("datauristring");

    console.log("Certificate PDF generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf: pdfBase64,
        message: "Certificate generated successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-certificate:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
