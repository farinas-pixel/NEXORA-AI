-- 20261023_friends_chat_remediation.sql
-- NEXORA AI: Phase 1 Remediation for Friends Chat & Social Collaboration
-- Security Hardening: Enforces strict conversation membership RLS, symmetric DM verification,
-- foreign key alignment to public.profiles, group leave procedure, and safe message lifecycle.

-- 1. PROFILES ALIGNMENT & BACKFILL
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'NEXORA User',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Idempotently backfill missing profiles from auth.users if any exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO public.profiles (id, email, full_name)
        SELECT 
            u.id, 
            u.email, 
            COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1), 'NEXORA User')
        FROM auth.users u
        WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
CREATE POLICY "Users can upsert own profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. FRIENDSHIPS TABLE & FOREIGN KEY REALIGNMENT
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_pair UNIQUE (user_id, friend_id)
);

-- Realign foreign keys from auth.users to public.profiles for PostgREST embedded joins
DO $$
BEGIN
    ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_user_id_fkey;
    ALTER TABLE public.friendships DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;
    
    ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    ALTER TABLE public.friendships 
        ADD CONSTRAINT friendships_friend_id_fkey FOREIGN KEY (friend_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships involving them" ON public.friendships;
CREATE POLICY "Users can view friendships involving them"
    ON public.friendships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert friendship request" ON public.friendships;
CREATE POLICY "Users can insert friendship request"
    ON public.friendships FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND user_id != friend_id
        AND status = 'pending'
    );

DROP POLICY IF EXISTS "Users can update their friendship status" ON public.friendships;
CREATE POLICY "Users can update their friendship status"
    ON public.friendships FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id)
    WITH CHECK (
        auth.uid() = user_id OR auth.uid() = friend_id
    );

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
    ON public.friendships FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 3. SOCIAL GROUPS TABLE & MEMBERSHIP
CREATE TABLE IF NOT EXISTS public.social_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_ids UUID[] NOT NULL DEFAULT '{}',
    member_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.social_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view groups they belong to" ON public.social_groups;
CREATE POLICY "Members can view groups they belong to"
    ON public.social_groups FOR SELECT
    TO authenticated
    USING (auth.uid() = ANY(member_ids) OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.social_groups;
CREATE POLICY "Authenticated users can create groups"
    ON public.social_groups FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = created_by
        AND auth.uid() = ANY(member_ids)
        AND auth.uid() = ANY(admin_ids)
    );

DROP POLICY IF EXISTS "Admins can update group" ON public.social_groups;
CREATE POLICY "Admins can update group"
    ON public.social_groups FOR UPDATE
    TO authenticated
    USING (auth.uid() = ANY(admin_ids) OR auth.uid() = created_by)
    WITH CHECK (auth.uid() = ANY(admin_ids) OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can delete group" ON public.social_groups;
CREATE POLICY "Admins can delete group"
    ON public.social_groups FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = ANY(admin_ids));

-- 4. SECURITY DEFINER PROCEDURES & MEMBERSHIP VALIDATION

-- Helper 1: Verify whether a user is an authorized participant of a conversation
CREATE OR REPLACE FUNCTION public.can_access_social_message(
    p_conversation_id TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_group_id UUID;
    v_u1 TEXT;
    v_u2 TEXT;
    v_other_id UUID;
BEGIN
    IF p_user_id IS NULL OR p_conversation_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Case A: Direct Message (Format: dm_<uuid1>_<uuid2> where uuid1 < uuid2)
    IF p_conversation_id LIKE 'dm_%_%' THEN
        v_u1 := split_part(p_conversation_id, '_', 2);
        v_u2 := split_part(p_conversation_id, '_', 3);

        -- Must be one of the two participants
        IF p_user_id::text = v_u1 THEN
            BEGIN
                v_other_id := v_u2::uuid;
            EXCEPTION WHEN OTHERS THEN
                RETURN FALSE;
            END;
        ELSIF p_user_id::text = v_u2 THEN
            BEGIN
                v_other_id := v_u1::uuid;
            EXCEPTION WHEN OTHERS THEN
                RETURN FALSE;
            END;
        ELSE
            -- User is an unrelated third party
            RETURN FALSE;
        END IF;

        -- Verify accepted friendship exists between p_user_id and v_other_id
        RETURN EXISTS (
            SELECT 1 FROM public.friendships
            WHERE status = 'accepted'
              AND (
                  (user_id = p_user_id AND friend_id = v_other_id)
                  OR
                  (user_id = v_other_id AND friend_id = p_user_id)
              )
        );

    -- Case B: Group Message (Format: grp_<group_uuid>)
    ELSIF p_conversation_id LIKE 'grp_%' THEN
        BEGIN
            v_group_id := substring(p_conversation_id FROM 5)::uuid;
        EXCEPTION WHEN OTHERS THEN
            RETURN FALSE;
        END;

        RETURN EXISTS (
            SELECT 1 FROM public.social_groups
            WHERE id = v_group_id
              AND (p_user_id = ANY(member_ids) OR p_user_id = created_by)
        );
    END IF;

    RETURN FALSE;
END;
$$;

-- Helper 2: Check if user is group admin
CREATE OR REPLACE FUNCTION public.is_social_group_admin(
    p_conversation_id TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_group_id UUID;
BEGIN
    IF p_user_id IS NULL OR p_conversation_id IS NULL OR NOT (p_conversation_id LIKE 'grp_%') THEN
        RETURN FALSE;
    END IF;

    BEGIN
        v_group_id := substring(p_conversation_id FROM 5)::uuid;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;

    RETURN EXISTS (
        SELECT 1 FROM public.social_groups
        WHERE id = v_group_id
          AND (p_user_id = ANY(admin_ids) OR p_user_id = created_by)
    );
END;
$$;

-- Helper 3: Safe "Delete for Me" without granting broad UPDATE permissions
CREATE OR REPLACE FUNCTION public.delete_social_message_for_me(p_message_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_convo_id TEXT;
BEGIN
    IF v_user_id IS NULL OR p_message_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT conversation_id INTO v_convo_id
    FROM public.social_messages
    WHERE id = p_message_id;

    IF v_convo_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Verify caller has legitimate access to the conversation
    IF NOT public.can_access_social_message(v_convo_id, v_user_id) THEN
        RETURN FALSE;
    END IF;

    -- Append user to deleted_for array idempotently
    UPDATE public.social_messages
    SET deleted_for = array_append(
        array_remove(deleted_for, v_user_id),
        v_user_id
    )
    WHERE id = p_message_id;

    RETURN TRUE;
END;
$$;

-- Helper 4: Safe "Clear Chat" for the caller without affecting other participants
CREATE OR REPLACE FUNCTION public.clear_social_chat_for_user(p_conversation_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL OR p_conversation_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF NOT public.can_access_social_message(p_conversation_id, v_user_id) THEN
        RETURN FALSE;
    END IF;

    UPDATE public.social_messages
    SET deleted_for = array_append(
        array_remove(deleted_for, v_user_id),
        v_user_id
    )
    WHERE conversation_id = p_conversation_id
      AND NOT (v_user_id = ANY(deleted_for));

    RETURN TRUE;
END;
$$;

-- Helper 5: Non-admin group leave with automatic admin succession
CREATE OR REPLACE FUNCTION public.leave_social_group(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_member_ids UUID[];
    v_admin_ids UUID[];
    v_remaining_members UUID[];
    v_remaining_admins UUID[];
BEGIN
    IF v_user_id IS NULL OR p_group_id IS NULL THEN
        RETURN FALSE;
    END IF;

    SELECT member_ids, admin_ids
    INTO v_member_ids, v_admin_ids
    FROM public.social_groups
    WHERE id = p_group_id;

    IF v_member_ids IS NULL OR NOT (v_user_id = ANY(v_member_ids)) THEN
        RETURN FALSE;
    END IF;

    v_remaining_members := array_remove(v_member_ids, v_user_id);
    v_remaining_admins := array_remove(v_admin_ids, v_user_id);

    -- Auto-promote first remaining member if all admins leave
    IF cardinality(v_remaining_admins) = 0 AND cardinality(v_remaining_members) > 0 THEN
        v_remaining_admins := ARRAY[v_remaining_members[1]];
    END IF;

    UPDATE public.social_groups
    SET member_ids = v_remaining_members,
        admin_ids = v_remaining_admins,
        updated_at = NOW()
    WHERE id = p_group_id;

    RETURN TRUE;
END;
$$;

-- Revoke execute from PUBLIC and grant strictly to authenticated / service_role
REVOKE ALL ON FUNCTION public.can_access_social_message(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_social_message(TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_social_group_admin(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_social_group_admin(TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.delete_social_message_for_me(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_social_message_for_me(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.clear_social_chat_for_user(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_social_chat_for_user(TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.leave_social_group(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leave_social_group(UUID) TO authenticated, service_role;

-- 5. SOCIAL MESSAGES HARDENED RLS POLICIES
CREATE TABLE IF NOT EXISTS public.social_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted_everyone BOOLEAN DEFAULT FALSE,
    deleted_for UUID[] DEFAULT '{}',
    reactions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies completely
DROP POLICY IF EXISTS "Participants can view messages" ON public.social_messages;
DROP POLICY IF EXISTS "Sender can insert message" ON public.social_messages;
DROP POLICY IF EXISTS "Authorized users can update message" ON public.social_messages;
DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.social_messages;
DROP POLICY IF EXISTS "Authorized users can insert messages to their conversations" ON public.social_messages;
DROP POLICY IF EXISTS "Author can edit own message" ON public.social_messages;
DROP POLICY IF EXISTS "Author or admin can update message" ON public.social_messages;
DROP POLICY IF EXISTS "Author or admin can delete message" ON public.social_messages;

-- A. SELECT: Must be verified participant AND not deleted for this user
CREATE POLICY "Participants can view conversation messages"
    ON public.social_messages FOR SELECT
    TO authenticated
    USING (
        public.can_access_social_message(conversation_id, auth.uid())
        AND NOT (auth.uid() = ANY(deleted_for))
    );

-- B. INSERT: Sender must be authentic caller AND must be member of conversation
CREATE POLICY "Authorized users can insert messages to their conversations"
    ON public.social_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND public.can_access_social_message(conversation_id, auth.uid())
    );

-- C. UPDATE: Author can edit message or delete for everyone; Admin can delete for everyone
CREATE POLICY "Author or admin can update message"
    ON public.social_messages FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = sender_id
        OR public.is_social_group_admin(conversation_id, auth.uid())
    )
    WITH CHECK (
        auth.uid() = sender_id
        OR (
            public.is_social_group_admin(conversation_id, auth.uid())
            AND is_deleted_everyone = true
        )
    );

-- D. DELETE: Author or group admin can delete
CREATE POLICY "Author or admin can delete message"
    ON public.social_messages FOR DELETE
    TO authenticated
    USING (
        auth.uid() = sender_id
        OR public.is_social_group_admin(conversation_id, auth.uid())
    );

-- Indexes for maximum query efficiency
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_social_groups_members ON public.social_groups USING GIN (member_ids);
CREATE INDEX IF NOT EXISTS idx_social_messages_convo ON public.social_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_sender ON public.social_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_created ON public.social_messages(created_at ASC);
