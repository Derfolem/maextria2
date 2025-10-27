import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context, tone, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    // Definir prompts específicos por tipo de conteúdo
    const prompts = {
      post: `Crie um post para ${platform || 'redes sociais'} sobre: ${context}. 
             Tom: ${tone || 'profissional'}. 
             Inclua:
             - Texto principal (max 200 caracteres)
             - Call-to-action forte
             - 3-5 hashtags relevantes
             - Emoji estratégico
             Formato: separe cada seção com "---"`,
      
      ad: `Crie um anúncio persuasivo para ${platform || 'Google/Meta Ads'} sobre: ${context}.
           Tom: ${tone || 'persuasivo'}.
           Inclua:
           - Título principal (max 60 caracteres)
           - Descrição (max 90 caracteres)
           - Call-to-action irresistível
           - 2 variações do título
           Use gatilhos mentais: escassez, urgência, prova social.
           Formato: separe cada seção com "---"`,
      
      email: `Crie um email marketing sobre: ${context}.
              Tom: ${tone || 'conversacional'}.
              Inclua:
              - Assunto irresistível (max 50 caracteres)
              - Preview text (max 80 caracteres)
              - Corpo do email (estruturado)
              - Call-to-action clara
              - PS com gatilho de urgência
              Formato: separe cada seção com "---"`,
      
      landing: `Crie copy para landing page sobre: ${context}.
                Tom: ${tone || 'persuasivo'}.
                Inclua:
                - Headline principal (max 80 caracteres)
                - Subheadline (max 120 caracteres)
                - 3 benefícios principais
                - Call-to-action
                - Garantia/prova social
                Formato: separe cada seção com "---"`,
      
      video: `Crie roteiro para vídeo sobre: ${context}.
              Tom: ${tone || 'dinâmico'}.
              Inclua:
              - Hook inicial (5 primeiros segundos)
              - Desenvolvimento (problema/solução)
              - Call-to-action final
              - Texto para thumbnail
              Formato: separe cada seção com "---"`,
    };

    const systemPrompt = `Você é um copywriter especialista em marketing digital da Maextria, 
    com expertise em educação online. Seu objetivo é criar textos persuasivos que:
    - Geram engajamento e conversões
    - Usam gatilhos mentais (escassez, urgência, prova social, autoridade)
    - São otimizados para cada plataforma
    - Seguem as melhores práticas de copywriting
    - Têm clareza, objetividade e persuasão
    
    Marca Maextria: "Aprender • Aplicar • Expandir"
    Público: Profissionais buscando desenvolvimento e certificação`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompts[type as keyof typeof prompts] || prompts.post }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos ao workspace Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Erro na API Lovable AI:', response.status, errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true,
        copy: generatedText,
        type,
        platform,
        tone 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro em generate-copy:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
