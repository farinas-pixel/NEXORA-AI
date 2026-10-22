-- 20261008_complete_nexora_schema.sql
-- COMPLETE NEXORA AI PRODUCTION DATABASE SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run

-- 1. PREFERENCES (1:1 with authenticated user)
create table if not exists public.preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    speech_rate real not null default 1.0,
    speech_pitch real not null default 1.0,
    voice_model text not null default 'en-US-Neural',
    auto_speak boolean not null default true,
    high_contrast boolean not null default false,
    reduce_motion boolean not null default false,
    solo_mode boolean not null default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. MEMORIES (Vault)
create table if not exists public.memories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    category text not null,
    content text not null,
    security_tier text not null check (security_tier in ('low','medium','high','critical')),
    confidence real not null default 1.0,
    timestamp timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_protected boolean default false
);

-- 3. TASKS (Planner)
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    category text not null check (category in ('study','work','fitness','daily')),
    due_date date not null default current_date,
    due_time time,
    priority text not null check (priority in ('low','medium','high')),
    completed boolean not null default false,
    recurring text check (recurring in ('daily','weekdays','weekly','none')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. GOALS (Life & Academic)
create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    deadline date not null default current_date,
    category text not null check (category in ('career','learning','fitness','finance')),
    progress_percent real not null default 0,
    priority text not null check (priority in ('low','medium','high')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 5. TOOL EXECUTION HISTORY
create table if not exists public.tool_execution_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    tool_name text not null,
    params jsonb,
    result jsonb,
    success boolean not null,
    executed_at timestamp with time zone default now()
);

-- 6. CONVERSATIONS
create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null default 'New Conversation',
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now()
);

-- 7. CONVERSATION MESSAGES
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

-- ENABLE ROW LEVEL SECURITY
alter table public.preferences enable row level security;
alter table public.memories enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.tool_execution_history enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

-- DROP EXISTING POLICIES IF RE-RUNNING
drop policy if exists "user can access own preferences" on public.preferences;
drop policy if exists "user can access own memories" on public.memories;
drop policy if exists "user can access own tasks" on public.tasks;
drop policy if exists "user can access own goals" on public.goals;
drop policy if exists "user can access own tool execution history" on public.tool_execution_history;

drop policy if exists "Users can select their own conversations" on public.conversations;
drop policy if exists "Users can insert their own conversations" on public.conversations;
drop policy if exists "Users can update their own conversations" on public.conversations;
drop policy if exists "Users can delete their own conversations" on public.conversations;

drop policy if exists "Users can select their own conversation messages" on public.conversation_messages;
drop policy if exists "Users can insert their own conversation messages" on public.conversation_messages;
drop policy if exists "Users can update their own conversation messages" on public.conversation_messages;
drop policy if exists "Users can delete their own conversation messages" on public.conversation_messages;

-- RLS POLICIES FOR PREFERENCES, MEMORIES, TASKS, GOALS, TOOL HISTORY
create policy "user can access own preferences"
    on public.preferences for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "user can access own memories"
    on public.memories for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "user can access own tasks"
    on public.tasks for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "user can access own goals"
    on public.goals for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "user can access own tool execution history"
    on public.tool_execution_history for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- RLS POLICIES FOR CONVERSATIONS
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

-- RLS POLICIES FOR CONVERSATION MESSAGES
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

-- PERFORMANCE INDEXES
create index if not exists idx_preferences_user on public.preferences(user_id);
create index if not exists idx_memories_user on public.memories(user_id);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_tool_history_user on public.tool_execution_history(user_id);
create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_conversation_messages_convo_id on public.conversation_messages(conversation_id);
create index if not exists idx_conversation_messages_user_id on public.conversation_messages(user_id);
create index if not exists idx_conversation_messages_created_at on public.conversation_messages(created_at asc);
