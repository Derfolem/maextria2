import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
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
    const { cursoId, certificadoId, preview, templateId } = body;
    const isPreview = preview === true;

    if (!isPreview && (!cursoId || !certificadoId)) {
      return new Response(
        JSON.stringify({ error: "Dados insuficientes para gerar certificado." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log("Generating certificate for user:", user.id, "course:", cursoId);

    // 3. Buscar certificado e validar
    let certificado: any = null;
    let provaResultado: any = null;
    let cursoInfo: { titulo: string; carga_horaria_horas: number } | null = null;

    if (isPreview) {
      const { data: roleRow } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleRow) {
        return new Response(
          JSON.stringify({ error: "Apenas admins podem gerar preview." }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }

      if (cursoId) {
        const { data: cursoData } = await supabaseClient
          .from("cursos")
          .select("titulo, carga_horaria_horas")
          .eq("id", cursoId)
          .maybeSingle();
        if (cursoData) {
          cursoInfo = {
            titulo: cursoData.titulo ?? "Curso",
            carga_horaria_horas: cursoData.carga_horaria_horas ?? 0,
          };
        }
      }

      certificado = {
        id: "preview",
        codigo_validacao: `MX-PREVIEW-${Date.now()}`,
        emitido_em: new Date().toISOString(),
        pago: true,
        cursos: cursoInfo,
      };
      provaResultado = { percentual: 93, aprovado: true };
    } else {
      const { data: certificadoData, error: certError } = await supabaseClient
        .from("certificados")
        .select(
          `
        *,
        cursos(titulo, carga_horaria_horas)
      `
        )
        .eq("id", certificadoId)
        .eq("usuario_id", user.id)
        .single();

      if (certError || !certificadoData) {
        return new Response(
          JSON.stringify({ error: "Certificado não encontrado ou não autorizado" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }

      certificado = certificadoData;

      // 4. Validar pagamento
      if (!certificado.pago) {
        return new Response(
          JSON.stringify({
            error: "Pagamento do certificado não identificado. Conclua a compra para baixar o PDF.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }

      // 5. Validar aprovação na prova (≥60%)
      const { data: provaData, error: provaError } = await supabaseClient
        .from("prova_resultado")
        .select("percentual, aprovado")
        .eq("usuario_id", user.id)
        .eq("curso_id", cursoId)
        .single();

      if (provaError || !provaData || !provaData.aprovado || provaData.percentual < 60) {
        return new Response(
          JSON.stringify({
            error: "Você precisa atingir pelo menos 60% na prova para emitir o certificado.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403,
          }
        );
      }

      provaResultado = provaData;
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

    const defaultTemplate = {
      nome: "Padrao MAEXTRIA",
      titulo: "CERTIFICADO DE CONCLUSAO",
      subtitulo: "Certificamos que",
      linha_curso: "concluiu com exito o curso",
      descricao:
        "promovido pela plataforma MAEXTRIA, com carga horaria total de {{carga_horaria}} horas, realizado na modalidade {{modalidade}}, com foco em aplicacao pratica, desenvolvimento profissional e formacao continuada.",
      local_emissao: "Rio de Janeiro - RJ",
      assinatura_label: "Diretoria Academica - MAEXTRIA",
      legal_texto:
        "Cursos livres realizados na modalidade Educacao a Distancia, conforme legislacao brasileira vigente, incluindo o Decreto no 9.057/2017 e normas aplicaveis a formacao continuada. Conteudo alinhado as boas praticas da ABED - Associacao Brasileira de Educacao a Distancia.",
      label_carga_horaria: "Carga horaria",
      label_modalidade: "Modalidade",
      label_data: "Data de conclusao",
      label_codigo: "Codigo de validacao",
      modalidade_texto: "Online (EAD)",
      logo_url: "",
      assinatura_imagem_url: "",
      papel_timbrado_url: "",
    };

    const resolveTemplateQuery = () => {
      const base = supabaseClient.from("certificate_templates").select("*");
      return base;
    };

    const templateQuery = templateId
      ? resolveTemplateQuery().eq("id", templateId)
      : resolveTemplateQuery().eq("ativo", true);

    const { data: templateRow, error: templateError } = await templateQuery.maybeSingle();

    const activeTemplate =
      templateError || !templateRow ? defaultTemplate : { ...defaultTemplate, ...templateRow };

    const resolveImageDataUri = async (url: string | null) => {
      if (!url) return null;
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const bytes = new Uint8Array(await response.arrayBuffer());
        const mime = response.headers.get("content-type") || "image/png";
        const format = mime.includes("jpeg") || mime.includes("jpg") ? "JPEG" : "PNG";
        return {
          dataUri: `data:${mime};base64,${base64Encode(bytes)}`,
          format,
        };
      } catch {
        return null;
      }
    };

    const resolveLogoDataUri = async () => {
      const templateLogo = activeTemplate.logo_url || null;
      const explicitUrl = Deno.env.get("CERT_LOGO_URL");
      const origin = req.headers.get("origin");
      const fallbackUrl = origin ? `${origin}/web-app-manifest-512x512.png` : null;
      const logoUrl = templateLogo || explicitUrl || fallbackUrl;
      const resolved = await resolveImageDataUri(logoUrl);
      return resolved;
    };

    // 7. Gerar PDF do certificado
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    const baseBg: [number, number, number] = [248, 247, 243];
    const deepTeal: [number, number, number] = [14, 59, 59];
    const accentTeal: [number, number, number] = [18, 92, 88];
    const lightLine: [number, number, number] = [210, 224, 221];
    const watermark: [number, number, number] = [232, 238, 236];

    const nomeAluno = (usuario.nome_completo || "Aluno").toString();
    const cpfAluno = (usuario.cpf || "Nao informado").toString();
    const cursoTitulo = (cursoInfo?.titulo ?? certificado.cursos?.titulo ?? "Curso").toString();
    const cargaHoraria = cursoInfo?.carga_horaria_horas ?? certificado.cursos?.carga_horaria_horas ?? 0;
    const dataFormatada = new Date(certificado.emitido_em).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const dataCurta = new Date(certificado.emitido_em).toLocaleDateString("pt-BR");
    const percentualProva = provaResultado?.percentual ?? null;
    const validationUrl = `https://maextria.com.br/verificar-certificado?codigo=${certificado.codigo_validacao}`;

    const templateReplacements: Record<string, string> = {
      "{{aluno}}": nomeAluno,
      "{{cpf}}": cpfAluno,
      "{{curso}}": cursoTitulo,
      "{{carga_horaria}}": String(cargaHoraria),
      "{{data_extenso}}": dataFormatada,
      "{{data_curta}}": dataCurta,
      "{{codigo_validacao}}": certificado.codigo_validacao,
      "{{modalidade}}": activeTemplate.modalidade_texto,
      "{{nota}}": percentualProva !== null ? `${percentualProva}%` : "N/A",
      "{{url_validacao}}": validationUrl,
    };

    const applyTemplate = (value: string) =>
      Object.entries(templateReplacements).reduce(
        (acc, [token, replacement]) => acc.split(token).join(replacement),
        value
      );

    const tituloCertificado = applyTemplate(activeTemplate.titulo);
    const subtituloCertificado = applyTemplate(activeTemplate.subtitulo);
    const linhaCurso = applyTemplate(activeTemplate.linha_curso);
    const descricaoTemplate = applyTemplate(activeTemplate.descricao);
    const localEmissao = applyTemplate(activeTemplate.local_emissao);
    const assinaturaLabel = applyTemplate(activeTemplate.assinatura_label);
    const legalTemplate = applyTemplate(activeTemplate.legal_texto);
    const labelCarga = applyTemplate(activeTemplate.label_carga_horaria);
    const labelModalidade = applyTemplate(activeTemplate.label_modalidade);
    const labelData = applyTemplate(activeTemplate.label_data);
    const labelCodigo = applyTemplate(activeTemplate.label_codigo);
    const modalidadeTexto = applyTemplate(activeTemplate.modalidade_texto);

    // Background
    doc.setFillColor(...baseBg);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    const papelTimbrado = await resolveImageDataUri(activeTemplate.papel_timbrado_url || null);
    if (papelTimbrado) {
      try {
        doc.addImage(papelTimbrado.dataUri, papelTimbrado.format, 0, 0, pageWidth, pageHeight);
      } catch (error) {
        console.error("Paper background render failed:", error);
      }
    }

    // Watermark X
    doc.setTextColor(...watermark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(160);
    doc.text("X", pageWidth / 2, pageHeight / 2 + 25, { align: "center" });

    // Border
    doc.setDrawColor(...lightLine);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    // Header line
    doc.setLineWidth(0.6);
    doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

    // Logo
    const logoData = await resolveLogoDataUri();
    if (logoData) {
      try {
        doc.addImage(logoData.dataUri, logoData.format, margin, margin - 2, 22, 22);
      } catch (error) {
        console.error("Logo render failed, continuing without logo:", error);
      }
    }

    // Brand
    doc.setTextColor(...deepTeal);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("MAEXTRIA", pageWidth / 2, margin + 12, { align: "center" });

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...accentTeal);
    doc.text(tituloCertificado, pageWidth / 2, margin + 24, { align: "center" });

    // Central block
    const blockTop = margin + 38;
    const blockHeight = 92;
    doc.setDrawColor(...lightLine);
    doc.setLineWidth(0.4);
    doc.rect(margin + 6, blockTop, pageWidth - (margin + 6) * 2, blockHeight);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(subtituloCertificado, pageWidth / 2, blockTop + 16, { align: "center" });

    // Student name
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...deepTeal);
    doc.setFontSize(24);
    doc.text(nomeAluno.toUpperCase(), pageWidth / 2, blockTop + 32, { align: "center" });

    // CPF
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 70, 70);
    doc.setFontSize(11);
    doc.text(`CPF: ${cpfAluno}`, pageWidth / 2, blockTop + 40, { align: "center" });

    // Course line
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(12);
    doc.text(linhaCurso, pageWidth / 2, blockTop + 54, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accentTeal);
    doc.setFontSize(18);
    doc.text(cursoTitulo.toUpperCase(), pageWidth / 2, blockTop + 68, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(70, 70, 70);
    doc.setFontSize(11);
    const descricaoLinhas = doc.splitTextToSize(descricaoTemplate, pageWidth * 0.72);
    doc.text(descricaoLinhas, pageWidth / 2, blockTop + 82, { align: "center" });

    // Info boxes
    const infoTop = blockTop + blockHeight + 8;
    const boxGap = 6;
    const boxWidth = (pageWidth - margin * 2 - boxGap * 3) / 4;
    const boxHeight = 20;

    const drawBox = (index: number, label: string, value: string) => {
      const x = margin + (boxWidth + boxGap) * index;
      const y = infoTop;
      doc.setDrawColor(...lightLine);
      doc.setLineWidth(0.4);
      doc.rect(x, y, boxWidth, boxHeight);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(label, x + 3, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...deepTeal);
      doc.text(value, x + 3, y + 15);
    };

    drawBox(0, labelCarga, `${cargaHoraria} horas`);
    drawBox(1, labelModalidade, modalidadeTexto);
    drawBox(2, labelData, dataCurta);
    drawBox(3, labelCodigo, certificado.codigo_validacao);

    // Footer with legal and QR
    const footerTop = infoTop + boxHeight + 6;
    const footerTextWidth = pageWidth - margin * 2 - 36;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(90, 90, 90);
    const legalText = doc.splitTextToSize(legalTemplate, footerTextWidth);
    doc.text(legalText, margin, footerTop + 10);

    const emissionLineY = footerTop + 26;
    doc.text(`${localEmissao}, ${dataFormatada}`, margin, emissionLineY);

    doc.setDrawColor(...lightLine);
    doc.setLineWidth(0.4);
    doc.line(pageWidth - margin - 70, emissionLineY - 6, pageWidth - margin, emissionLineY - 6);
    doc.text(assinaturaLabel, pageWidth - margin, emissionLineY, { align: "right" });

    const assinaturaImagem = await resolveImageDataUri(activeTemplate.assinatura_imagem_url || null);
    if (assinaturaImagem) {
      try {
        const signatureWidth = 38;
        const signatureHeight = 14;
        doc.addImage(
          assinaturaImagem.dataUri,
          assinaturaImagem.format,
          pageWidth - margin - signatureWidth,
          emissionLineY - 22,
          signatureWidth,
          signatureHeight
        );
      } catch (error) {
        console.error("Signature image render failed:", error);
      }
    }

    // QR Code
    const qrSize = 26;
    const qrX = pageWidth - margin - qrSize;
    const qrY = footerTop + 2;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(validationUrl)}`;
      const qrResponse = await fetch(qrUrl);
      if (qrResponse.ok) {
        const qrBytes = new Uint8Array(await qrResponse.arrayBuffer());
        const qrDataUri = `data:image/png;base64,${base64Encode(qrBytes)}`;
        doc.addImage(qrDataUri, "PNG", qrX, qrY, qrSize, qrSize);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text("Valide este certificado em:", qrX - 2, qrY + qrSize + 5, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.text("maextria.com.br/validar", qrX - 2, qrY + qrSize + 10, { align: "right" });
      }
    } catch (error) {
      console.error("QR render failed, continuing without QR:", error);
    }

    // Second page (verso)
    let modulos: Array<{ titulo: string; ordem: number }> | null = null;
    if (cursoId) {
      const { data: modulosData } = await supabaseClient
        .from("modulos")
        .select("titulo, ordem")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });
      modulos = modulosData || null;
    }

    doc.addPage("a4", "landscape");
    doc.setFillColor(...baseBg);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setDrawColor(...lightLine);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...deepTeal);
    doc.text("VERSO DO CERTIFICADO", margin, margin + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.text(`Curso: ${cursoTitulo}`, margin, margin + 28);
    doc.text(`Carga horaria total: ${cargaHoraria} horas`, margin, margin + 36);
    if (percentualProva !== null) {
      doc.text(`Nota final: ${percentualProva}%`, margin, margin + 44);
    }
    doc.text(`Codigo de validacao: ${certificado.codigo_validacao}`, margin, margin + 52);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...accentTeal);
    doc.text("Conteudos programaticos", margin, margin + 68);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const moduleTitles = (modulos || []).map(
      (modulo: any, index: number) => `${index + 1}. ${modulo.titulo}`
    );
    const fallbackModules = moduleTitles.length
      ? moduleTitles
      : [
          "1. Fundamentos e contexto",
          "2. Aplicacoes praticas",
          "3. Estudos de caso",
          "4. Projeto final",
        ];
    const moduleLines = doc.splitTextToSize(fallbackModules.join("  "), pageWidth - margin * 2 - 10);
    doc.text(moduleLines, margin, margin + 78);

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
