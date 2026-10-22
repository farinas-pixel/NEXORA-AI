-- 20261009_create_reminders_table.sql
-- NEXORA AI: Persistent User-Owned Reminders with Row Level Security (RLS)
-- Safe to execute via Supabase Dashboard SQL Editor or Supabase CLI.

-- 1. CREATE REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_time TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL DEFAULT 'personal',
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES FOR IDEMPOTENT RERUNS
DROP POLICY IF EXISTS "Users can select their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

-- 4. RLS POLICIES (Enforce strict tenant isolation via auth.uid())
CREATE POLICY "Users can select their own reminders"
    ON public.reminders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
    ON public.reminders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
    ON public.reminders FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
    ON public.reminders FOR DELETE
    USING (auth.uid() = user_id);

-- 5. PERFORMANCE AND FILTERING INDEXES
CREATE INDEX IF NOT EXISTS idx_reminders_user_due 
    ON public.reminders (user_id, due_time);

CREATE INDEX IF NOT EXISTS idx_reminders_user_status_due 
    ON public.reminders (user_id, status, due_time);
