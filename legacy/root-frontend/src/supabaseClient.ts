import { createClient } from '@supabase/supabase-js'

// Pegando variáveis de ambiente (melhor prática)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
