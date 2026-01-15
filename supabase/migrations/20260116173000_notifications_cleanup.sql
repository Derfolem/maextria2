-- Cleanup legacy internal messaging data and drop unused tables
DELETE FROM public.internal_threads
WHERE type IS DISTINCT FROM 'broadcast'
   OR created_by_role IS DISTINCT FROM 'admin';

DROP TABLE IF EXISTS public.internal_message_deletions;
