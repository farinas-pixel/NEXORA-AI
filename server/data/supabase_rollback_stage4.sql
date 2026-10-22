-- ====================================================================
-- NEXORA AI — Production Supabase PostgreSQL Schema Rollback Script
-- Target: Supabase Free Tier SQL Editor
-- Scope: Safely reverts Stage 4 RLS policies back to baseline state.
-- Safety: Fully transactional. Does NOT drop tables or columns to preserve
--         any data written during Stage 4 operation.
-- ====================================================================

BEGIN;

-- 1. Tasks: Drop Stage 4 granular RLS policies
DROP POLICY IF EXISTS "Users can only view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can only insert their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can only update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can only delete their own tasks" ON public.tasks;

-- Restore baseline tasks permissive ALL policy
DROP POLICY IF EXISTS "user can access own tasks" ON public.tasks;
CREATE POLICY "user can access own tasks"
    ON public.tasks FOR ALL
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Memories: Drop Stage 4 granular RLS policies
DROP POLICY IF EXISTS "Users can only view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can only insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can only update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can only delete their own memories" ON public.memories;

-- Restore baseline memories permissive ALL policy
DROP POLICY IF EXISTS "user can access own memories" ON public.memories;
CREATE POLICY "user can access own memories"
    ON public.memories FOR ALL
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMIT;
