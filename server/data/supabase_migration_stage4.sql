-- ====================================================================
-- NEXORA AI — Production Supabase PostgreSQL Schema with RLS
-- Stage 4 Consolidated Production Database Migration (100% Free-Tier)
-- Target: Supabase Free Tier SQL Editor
-- Architecture: Transactional DDL migration, native UUID primary keys,
--               DATE due_date, non-destructive additive columns, RLS enforcement.
-- Pre-conditions: Requires pre-migration backup and full-row integrity verification.
-- ====================================================================

BEGIN;

-- 1. Ensure Cryptographic Extension (Standard in Supabase extensions schema)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tasks Table: Create if missing, or additively upgrade if existing
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'daily' CHECK (category IN ('daily', 'study', 'work', 'fitness')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure description column exists if table pre-existed from older migrations
ALTER TABLE public.tasks 
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Enable Row-Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies for Tasks (Scoped strictly to authenticated role)
DROP POLICY IF EXISTS "Users can only view their own tasks" ON public.tasks;
CREATE POLICY "Users can only view their own tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own tasks" ON public.tasks;
CREATE POLICY "Users can only insert their own tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own tasks" ON public.tasks;
CREATE POLICY "Users can only update their own tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own tasks" ON public.tasks;
CREATE POLICY "Users can only delete their own tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Retire legacy permissive FOR ALL policy in same atomic transaction
DROP POLICY IF EXISTS "user can access own tasks" ON public.tasks;

-- Performance Indexes for User-Scoped Queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);


-- 3. Memories Table: Create if missing, or additively upgrade if existing
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('personal', 'preference', 'study', 'work', 'health', 'general')),
    content TEXT NOT NULL,
    security_tier TEXT NOT NULL DEFAULT 'low' CHECK (security_tier IN ('low', 'medium', 'high', 'critical', 'standard', 'sensitive')),
    is_protected BOOLEAN NOT NULL DEFAULT FALSE,
    digest TEXT,
    encrypted_payload TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure vault and timestamp columns exist if table pre-existed from older migrations
ALTER TABLE public.memories 
    ADD COLUMN IF NOT EXISTS digest TEXT;

ALTER TABLE public.memories 
    ADD COLUMN IF NOT EXISTS encrypted_payload TEXT;

-- Safe created_at column migration order:
-- 1. Add column nullable without default (prevents premature stamping with now())
ALTER TABLE public.memories 
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

-- 2. Backfill from historical 'timestamp' column if it exists and has values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'memories' AND column_name = 'timestamp'
    ) THEN
        UPDATE public.memories 
        SET created_at = timestamp 
        WHERE created_at IS NULL AND timestamp IS NOT NULL;
    END IF;
END $$;

-- 3. Fallback to updated_at if created_at is still NULL
UPDATE public.memories 
SET created_at = updated_at 
WHERE created_at IS NULL AND updated_at IS NOT NULL;

-- 4. Final fallback to now() for any legacy rows with neither timestamp nor updated_at
UPDATE public.memories 
SET created_at = now() 
WHERE created_at IS NULL;

-- 5. Enforce NOT NULL constraint and set default now() for future rows
ALTER TABLE public.memories 
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.memories 
    ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.memories 
    ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT FALSE;

-- Broaden security_tier check constraint to support all mobile and server tiers
ALTER TABLE public.memories 
    DROP CONSTRAINT IF EXISTS memories_security_tier_check;

ALTER TABLE public.memories 
    ADD CONSTRAINT memories_security_tier_check 
    CHECK (security_tier IN ('low', 'medium', 'high', 'critical', 'standard', 'sensitive'));

-- Enable Row-Level Security
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Granular RLS Policies for Memories (Scoped strictly to authenticated role)
DROP POLICY IF EXISTS "Users can only view their own memories" ON public.memories;
CREATE POLICY "Users can only view their own memories"
    ON public.memories FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only insert their own memories" ON public.memories;
CREATE POLICY "Users can only insert their own memories"
    ON public.memories FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only update their own memories" ON public.memories;
CREATE POLICY "Users can only update their own memories"
    ON public.memories FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only delete their own memories" ON public.memories;
CREATE POLICY "Users can only delete their own memories"
    ON public.memories FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Retire legacy permissive FOR ALL policy in same atomic transaction
DROP POLICY IF EXISTS "user can access own memories" ON public.memories;

-- Performance Indexes for User-Scoped Queries
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(user_id, category);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at DESC);

COMMIT;
