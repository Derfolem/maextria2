export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cartoes_credito: {
        Row: {
          bandeira: string
          criado_em: string | null
          id: string
          nome_titular: string
          padrao: boolean | null
          token_gateway: string | null
          ultimos_digitos: string
          usuario_id: string
        }
        Insert: {
          bandeira: string
          criado_em?: string | null
          id?: string
          nome_titular: string
          padrao?: boolean | null
          token_gateway?: string | null
          ultimos_digitos: string
          usuario_id: string
        }
        Update: {
          bandeira?: string
          criado_em?: string | null
          id?: string
          nome_titular?: string
          padrao?: boolean | null
          token_gateway?: string | null
          ultimos_digitos?: string
          usuario_id?: string
        }
        Relationships: []
      }
      certificados: {
        Row: {
          codigo_validacao: string
          curso_id: string | null
          emitido_em: string | null
          id: string
          link_pdf: string | null
          pago: boolean | null
          usuario_id: string
        }
        Insert: {
          codigo_validacao: string
          curso_id?: string | null
          emitido_em?: string | null
          id?: string
          link_pdf?: string | null
          pago?: boolean | null
          usuario_id: string
        }
        Update: {
          codigo_validacao?: string
          curso_id?: string | null
          emitido_em?: string | null
          id?: string
          link_pdf?: string | null
          pago?: boolean | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificados_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          ativo: boolean | null
          carga_horaria_horas: number | null
          categoria: string | null
          criado_em: string | null
          descricao: string | null
          id: string
          imagem_capa_url: string | null
          preco_certificado: number | null
          publico_alvo: string | null
          slug: string
          titulo: string
        }
        Insert: {
          ativo?: boolean | null
          carga_horaria_horas?: number | null
          categoria?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          imagem_capa_url?: string | null
          preco_certificado?: number | null
          publico_alvo?: string | null
          slug: string
          titulo: string
        }
        Update: {
          ativo?: boolean | null
          carga_horaria_horas?: number | null
          categoria?: string | null
          criado_em?: string | null
          descricao?: string | null
          id?: string
          imagem_capa_url?: string | null
          preco_certificado?: number | null
          publico_alvo?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          ativa: boolean
          curso_id: string
          data_matricula: string
          id: string
          usuario_id: string
        }
        Insert: {
          ativa?: boolean
          curso_id: string
          data_matricula?: string
          id?: string
          usuario_id: string
        }
        Update: {
          ativa?: boolean
          curso_id?: string
          data_matricula?: string
          id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          conteudo_texto_html: string | null
          criado_em: string | null
          curso_id: string | null
          id: string
          ordem: number
          titulo_modulo: string
          video_url: string | null
        }
        Insert: {
          conteudo_texto_html?: string | null
          criado_em?: string | null
          curso_id?: string | null
          id?: string
          ordem: number
          titulo_modulo: string
          video_url?: string | null
        }
        Update: {
          conteudo_texto_html?: string | null
          criado_em?: string | null
          curso_id?: string | null
          id?: string
          ordem?: number
          titulo_modulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_modulo: {
        Row: {
          concluido: boolean | null
          concluido_em: string | null
          id: string
          modulo_id: string | null
          usuario_id: string
        }
        Insert: {
          concluido?: boolean | null
          concluido_em?: string | null
          id?: string
          modulo_id?: string | null
          usuario_id: string
        }
        Update: {
          concluido?: boolean | null
          concluido_em?: string | null
          id?: string
          modulo_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_modulo_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      prova_questoes: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          correta: string
          curso_id: string | null
          enunciado: string
          id: string
        }
        Insert: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          correta: string
          curso_id?: string | null
          enunciado: string
          id?: string
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          correta?: string
          curso_id?: string | null
          enunciado?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prova_questoes_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      prova_resultado: {
        Row: {
          acertos: number
          aprovado: boolean
          curso_id: string | null
          id: string
          percentual: number
          realizado_em: string | null
          total_questoes: number
          usuario_id: string
        }
        Insert: {
          acertos: number
          aprovado: boolean
          curso_id?: string | null
          id?: string
          percentual: number
          realizado_em?: string | null
          total_questoes: number
          usuario_id: string
        }
        Update: {
          acertos?: number
          aprovado?: boolean
          curso_id?: string | null
          id?: string
          percentual?: number
          realizado_em?: string | null
          total_questoes?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prova_resultado_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cpf: string | null
          criado_em: string | null
          email: string
          id: string
          nome_completo: string
        }
        Insert: {
          cpf?: string | null
          criado_em?: string | null
          email: string
          id?: string
          nome_completo: string
        }
        Update: {
          cpf?: string | null
          criado_em?: string | null
          email?: string
          id?: string
          nome_completo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
