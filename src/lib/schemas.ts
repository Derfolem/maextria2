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
