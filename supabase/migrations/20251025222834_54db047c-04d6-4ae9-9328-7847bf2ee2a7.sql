-- Drop the previous view
DROP VIEW IF EXISTS public.relatorio_vendas;

-- Create RLS policy for relatorio instead of using a view
-- Admins can query transacoes_pagamento directly with proper filters