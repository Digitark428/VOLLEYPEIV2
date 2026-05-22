-- =====================================================
-- VOLLEY PÉI - Schéma Notifications (FUTUR)
-- =====================================================
-- À exécuter UNIQUEMENT quand on activera les notifications
-- =====================================================

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,

  type text not null check (type in (
    'tournament_new',
    'tournament_update',
    'tournament_reminder',
    'sponsor_new',
    'system'
  )),
  title text not null,
  body text not null,
  link text,
  read boolean default false not null,
  user_id uuid,
  metadata jsonb default '{}'::jsonb
);

create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_created_idx on public.notifications(created_at desc);
create index if not exists notifications_read_idx on public.notifications(read);

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  topics jsonb default '[]'::jsonb,
  user_id uuid
);

alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications
  for select using (user_id is null or user_id = auth.uid());

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications
  for update using (true) with check (true);

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications
  for insert with check (true);

drop policy if exists "push_subs_insert" on public.push_subscriptions;
create policy "push_subs_insert" on public.push_subscriptions
  for insert with check (true);

drop policy if exists "push_subs_select" on public.push_subscriptions;
create policy "push_subs_select" on public.push_subscriptions
  for select using (true);
