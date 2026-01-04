import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!openai) {
    openai = new OpenAI({ apiKey });
  }

  return openai;
}

export async function generateCourseImage(prompt: string): Promise<string> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional course cover image for an online learning platform: ${prompt}. Style: modern, educational, clean, professional.`,
      n: 1,
      size: "1024x1024",
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
}

export async function generateCourseDescription(
  title: string,
  category: string,
  difficulty: string
): Promise<string> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em criar descrições atrativas para cursos online. Crie descrições envolventes, informativas e profissionais em português do Brasil."
        },
        {
          role: "user",
          content: `Crie uma descrição detalhada e atrativa para um curso com as seguintes informações:
          Título: ${title}
          Categoria: ${category}
          Nível: ${difficulty}

          A descrição deve incluir:
          - O que o aluno aprenderá
          - Para quem é o curso
          - Benefícios principais
          - Máximo 200 palavras`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating description:', error);
    throw new Error('Failed to generate description');
  }
}

export async function generateLessonContent(
  lessonTitle: string,
  courseContext: string
): Promise<string> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Você é um instrutor educacional experiente. Crie conteúdo didático, claro e envolvente para aulas online em português do Brasil."
        },
        {
          role: "user",
          content: `Crie o conteúdo textual para uma aula com o título "${lessonTitle}" no contexto do curso: ${courseContext}.

          O conteúdo deve ser:
          - Didático e fácil de entender
          - Bem estruturado com tópicos
          - Incluir exemplos práticos quando relevante
          - Entre 300-500 palavras`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw new Error('Failed to generate lesson content');
  }
}

export async function chatWithAI(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      return 'Oi, eu sou o X. Para ativar respostas inteligentes, o time precisa configurar a chave da MAEXTRIA. Enquanto isso, posso ajudar com informacoes gerais sobre cursos, certificados e navegacao.';
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `Você é o X, assistente humano da MAEXTRIA.
        Seu papel é orientar com clareza, empatia e precisão, sem jargões desnecessários.
        Você ajuda os usuários a:
        - Entender como a plataforma funciona
        - Encontrar cursos adequados
        - Responder dúvidas sobre matrículas, certificados e pagamentos
        - Orientar professores sobre como criar e gerenciar cursos
        - Explicar as funcionalidades para administradores

        Tom: profissional, calmo, objetivo e humano. Responda em português do Brasil.
        Se não souber algo específico, seja honesto e ofereça um próximo passo claro.`
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: messages,
      temperature: 0.8,
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw new Error('Failed to process chat message');
  }
}
