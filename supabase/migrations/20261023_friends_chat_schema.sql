-- 20261023_friends_chat_schema.sql
-- NEXORA AI: Friends Space, Secure Friendships, 1-on-1 & Group Messaging with RLS
-- Security Hardened: Strict conversation membership validation, UUID typing, symmetric DMs.

-- 1. PUBLIC PROFILES DIRECTORY (for genuine user discovery)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'NEXORA User',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- 2. FRIENDSHIPS & CONNECTION REQUESTS
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_friend_pair UNIQUE (user_id, friend_id)
);

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

-- 3. SOCIAL CHAT GROUPS
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

-- 4. SECURITY DEFINER HELPER FUNCTIONS
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
            RETURN FALSE;
        END IF;

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

    IF NOT public.can_access_social_message(v_convo_id, v_user_id) THEN
        RETURN FALSE;
    END IF;

    UPDATE public.social_messages
    SET deleted_for = array_append(
        array_remove(deleted_for, v_user_id),
        v_user_id
    )
    WHERE id = p_message_id;

    RETURN TRUE;
END;
$$;

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

-- 5. SOCIAL MESSAGES TABLE (1-to-1 & Group Chats)
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

DROP POLICY IF EXISTS "Participants can view messages" ON public.social_messages;
DROP POLICY IF EXISTS "Sender can insert message" ON public.social_messages;
DROP POLICY IF EXISTS "Authorized users can update message" ON public.social_messages;
DROP POLICY IF EXISTS "Participants can view conversation messages" ON public.social_messages;
DROP POLICY IF EXISTS "Authorized users can insert messages to their conversations" ON public.social_messages;
DROP POLICY IF EXISTS "Author can edit own message" ON public.social_messages;
DROP POLICY IF EXISTS "Author or admin can update message" ON public.social_messages;
DROP POLICY IF EXISTS "Author or admin can delete message" ON public.social_messages;

CREATE POLICY "Participants can view conversation messages"
    ON public.social_messages FOR SELECT
    TO authenticated
    USING (
        public.can_access_social_message(conversation_id, auth.uid())
        AND NOT (auth.uid() = ANY(deleted_for))
    );

CREATE POLICY "Authorized users can insert messages to their conversations"
    ON public.social_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND public.can_access_social_message(conversation_id, auth.uid())
    );

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

CREATE POLICY "Author or admin can delete message"
    ON public.social_messages FOR DELETE
    TO authenticated
    USING (
        auth.uid() = sender_id
        OR public.is_social_group_admin(conversation_id, auth.uid())
    );

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_social_groups_members ON public.social_groups USING GIN (member_ids);
CREATE INDEX IF NOT EXISTS idx_social_messages_convo ON public.social_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_sender ON public.social_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_created ON public.social_messages(created_at ASC);
