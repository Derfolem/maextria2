-- Fix payment system vulnerability by removing permissive RLS policies
-- Payment transactions should only be modified by edge functions using service role key

-- Drop the overly permissive policies that allow anyone to insert/update
DROP POLICY IF EXISTS "Sistema pode inserir transações" ON public.transacoes_pagamento;
DROP POLICY IF EXISTS "Sistema pode atualizar transações" ON public.transacoes_pagamento;

-- These policies remain in place (they are safe):
-- "Admins podem ver todas transações" - allows admins to view
-- "Usuários veem próprias transações" - allows users to view their own

-- Note: Edge functions using service_role_key bypass RLS policies
-- This ensures only backend systems can write to payment transactions