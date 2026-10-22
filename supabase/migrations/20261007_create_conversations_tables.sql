-- 20261007_create_conversations_tables.sql
-- Supabase migration: Real user-isolated conversation infrastructure with RLS

-- 1. conversations table
create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'New Conversation',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- 2. conversation_messages table
create table if not exists public.conversation_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    tool_result jsonb,
    metadata jsonb,
    created_at timestamp with time zone not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- RLS Policies for conversations
create policy "Users can select their own conversations"
    on public.conversations for select
    using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
    on public.conversations for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
    on public.conversations for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own conversations"
    on public.conversations for delete
    using (auth.uid() = user_id);

-- RLS Policies for conversation_messages
create policy "Users can select their own conversation messages"
    on public.conversation_messages for select
    using (auth.uid() = user_id);

create policy "Users can insert their own conversation messages"
    on public.conversation_messages for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own conversation messages"
    on public.conversation_messages for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own conversation messages"
    on public.conversation_messages for delete
    using (auth.uid() = user_id);

-- Indexes for performance and isolation
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_conversation_messages_convo_id on public.conversation_messages(conversation_id);
create index if not exists idx_conversation_messages_user_id on public.conversation_messages(user_id);
create index if not exists idx_conversation_messages_created_at on public.conversation_messages(created_at asc);
