-- Limpeza completa das métricas de marketing
-- Executar no Supabase após o deploy do frontend

-- Tabelas de tracking de visitantes e eventos
DROP TABLE IF EXISTS public.marketing_pageviews CASCADE;
DROP TABLE IF EXISTS public.marketing_events CASCADE;
DROP TABLE IF EXISTS public.blog_events CASCADE;

-- Tabelas de CRM/leads de marketing
DROP TABLE IF EXISTS public.marketing_lead_atividades CASCADE;
DROP TABLE IF EXISTS public.marketing_leads CASCADE;
DROP TABLE IF EXISTS public.marketing_posts CASCADE;

-- Funções auxiliares de marketing
DROP FUNCTION IF EXISTS public.admin_interest_metrics(integer);
DROP FUNCTION IF EXISTS public.update_marketing_updated_at();

-- Remover configurações de marketing/banner/pixel do banco
DELETE FROM public.configuracoes_site
WHERE chave LIKE 'marketing_%';
