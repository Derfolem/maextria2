import { z } from "zod";

export const cursoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres"),
  categoria: z.string().optional(),
  descricao: z.string().optional(),
  publico_alvo: z.string().optional(),
  carga_horaria_horas: z.number().min(1, "Carga horária deve ser maior que 0").optional(),
  imagem_capa_url: z.string().url("URL inválida").optional().or(z.literal("")),
  preco_certificado: z.number().min(0, "Preço deve ser maior ou igual a 0").optional(),
  ativo: z.boolean().default(true),
});

export const moduloSchema = z.object({
  titulo_modulo: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  ordem: z.number().min(1, "Ordem deve ser maior que 0"),
  video_url: z.string().url("URL inválida").optional().or(z.literal("")),
  conteudo_texto_html: z.string().optional(),
  curso_id: z.string().uuid("ID do curso inválido"),
});

export const questaoSchema = z.object({
  enunciado: z.string().min(10, "Enunciado deve ter no mínimo 10 caracteres"),
  alternativa_a: z.string().min(1, "Alternativa A é obrigatória"),
  alternativa_b: z.string().min(1, "Alternativa B é obrigatória"),
  alternativa_c: z.string().min(1, "Alternativa C é obrigatória"),
  alternativa_d: z.string().min(1, "Alternativa D é obrigatória"),
  correta: z.enum(["a", "b", "c", "d"], { required_error: "Selecione a resposta correta" }),
  curso_id: z.string().uuid("ID do curso inválido"),
});

export const contatoSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  assunto: z.string().trim().min(5, "Assunto deve ter no mínimo 5 caracteres").max(200, "Assunto deve ter no máximo 200 caracteres"),
  mensagem: z.string().trim().min(10, "Mensagem deve ter no mínimo 10 caracteres").max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
});

export const leadSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  telefone: z.string().trim().max(20, "Telefone deve ter no máximo 20 caracteres").optional().or(z.literal("")),
  empresa: z.string().trim().max(100, "Empresa deve ter no máximo 100 caracteres").optional().or(z.literal("")),
  cargo: z.string().trim().max(100, "Cargo deve ter no máximo 100 caracteres").optional().or(z.literal("")),
  origem: z.enum(["website", "facebook", "instagram", "linkedin", "indicacao", "outro"], { required_error: "Selecione a origem" }),
  status: z.enum(["novo", "contato", "qualificado", "proposta", "negociacao", "ganho", "perdido"], { required_error: "Selecione o status" }),
  pontuacao: z.number().int("Pontuação deve ser um número inteiro").min(0, "Pontuação deve ser no mínimo 0").max(100, "Pontuação deve ser no máximo 100"),
  notas: z.string().trim().max(2000, "Notas devem ter no máximo 2000 caracteres").optional().or(z.literal("")),
  valor_potencial: z.string().optional().or(z.literal("")),
});
