-- 20231006_create_user_tables.sql
-- Supabase migration: user‑isolated data tables and Row Level Security (RLS)
-- Run this script using the Supabase CLI: supabase db reset && supabase db push

-- 1. preferences (one‑to‑one with auth user)
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

-- 2. memories (vault)
create table if not exists public.memories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    category text not null,
    content text not null,
    security_tier text not null check (security_tier in ('low','medium','high','critical')),
    confidence real not null,
    timestamp timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    is_protected boolean default false
);

-- 3. tasks (planner)
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    category text not null check (category in ('study','work','fitness','daily')),
    due_date date not null,
    due_time time,
    priority text not null check (priority in ('low','medium','high')),
    completed boolean not null default false,
    recurring text check (recurring in ('daily','weekdays','weekly','none')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 4. goals
create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    title text not null,
    deadline date not null,
    category text not null check (category in ('career','learning','fitness','finance')),
    progress_percent real not null default 0,
    priority text not null check (priority in ('low','medium','high')),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 5. tool_execution_history
create table if not exists public.tool_execution_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    tool_name text not null,
    params jsonb,
    result jsonb,
    success boolean not null,
    executed_at timestamp with time zone default now()
);

-- Enable Row Level Security for all user‑owned tables
alter table public.preferences enable row level security;
alter table public.memories enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.tool_execution_history enable row level security;

-- RLS policies: users can only select/insert/update/delete their own rows
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

-- Indexes for fast look‑ups
create index if not exists idx_memories_user on public.memories(user_id);
create index if not exists idx_tasks_user on public.tasks(user_id);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_tool_history_user on public.tool_execution_history(user_id);
