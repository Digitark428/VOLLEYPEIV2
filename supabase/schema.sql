-- =====================================================
-- VOLLEY PÉI - Schéma Supabase
-- =====================================================
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLE : tournaments
-- =====================================================
create table if not exists public.tournaments (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Champs obligatoires
  name text not null,
  date date not null,
  time time not null,
  city text not null,
  type text not null check (type in (
    'Beach volley',
    'Volley indoor',
    'Green volley',
    'Officiel LRVB',
    'Sparing',
    'Loisirs'
  )),
  location text not null,
  players_count int not null,
  description text not null,
  poster_url text not null,

  -- Champs optionnels
  phone text,
  email text,

  -- Géolocalisation (optionnelle, pour la carte)
  latitude double precision,
  longitude double precision
);

create index if not exists tournaments_date_idx on public.tournaments(date);
create index if not exists tournaments_type_idx on public.tournaments(type);

-- =====================================================
-- TABLE : sponsors
-- =====================================================
create table if not exists public.sponsors (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  name text not null,
  category text not null check (category in ('gold', 'silver', 'bronze')),
  image_url text not null,
  slogan text,
  website text,
  phone text,
  description text,
  gallery jsonb default '[]'::jsonb,  -- tableau d'URLs (max 10)
  display_order int default 0
);

create index if not exists sponsors_category_idx on public.sponsors(category);
create index if not exists sponsors_order_idx on public.sponsors(display_order);

-- =====================================================
-- TABLE : visits (compteur visites)
-- =====================================================
create table if not exists public.visits (
  id uuid primary key default uuid_generate_v4(),
  visited_at timestamptz default now() not null,
  date date generated always as (visited_at::date) stored
);

create index if not exists visits_date_idx on public.visits(date);
create index if not exists visits_at_idx on public.visits(visited_at);

-- =====================================================
-- TRIGGER : updated_at
-- =====================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tournaments_updated on public.tournaments;
create trigger trg_tournaments_updated
  before update on public.tournaments
  for each row execute function public.set_updated_at();

drop trigger if exists trg_sponsors_updated on public.sponsors;
create trigger trg_sponsors_updated
  before update on public.sponsors
  for each row execute function public.set_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
alter table public.tournaments enable row level security;
alter table public.sponsors enable row level security;
alter table public.visits enable row level security;

-- Lecture publique
drop policy if exists "tournaments_select_public" on public.tournaments;
create policy "tournaments_select_public" on public.tournaments
  for select using (true);

drop policy if exists "sponsors_select_public" on public.sponsors;
create policy "sponsors_select_public" on public.sponsors
  for select using (true);

drop policy if exists "visits_select_public" on public.visits;
create policy "visits_select_public" on public.visits
  for select using (true);

-- Insertion publique (publication libre de tournois, validation manuelle = false)
drop policy if exists "tournaments_insert_public" on public.tournaments;
create policy "tournaments_insert_public" on public.tournaments
  for insert with check (true);

drop policy if exists "visits_insert_public" on public.visits;
create policy "visits_insert_public" on public.visits
  for insert with check (true);

-- Update / Delete : à protéger côté serveur via clé service_role pour l'admin
-- (l'app utilise la clé anon en frontend, et un check de mot de passe simple côté UI)
-- Pour autoriser la modification depuis l'admin sans auth Supabase, on ouvre tout :
-- IMPORTANT : sécurité gérée par l'écran admin (mot de passe), à durcir en prod.
drop policy if exists "tournaments_update_public" on public.tournaments;
create policy "tournaments_update_public" on public.tournaments
  for update using (true) with check (true);

drop policy if exists "tournaments_delete_public" on public.tournaments;
create policy "tournaments_delete_public" on public.tournaments
  for delete using (true);

drop policy if exists "sponsors_insert_public" on public.sponsors;
create policy "sponsors_insert_public" on public.sponsors
  for insert with check (true);

drop policy if exists "sponsors_update_public" on public.sponsors;
create policy "sponsors_update_public" on public.sponsors
  for update using (true) with check (true);

drop policy if exists "sponsors_delete_public" on public.sponsors;
create policy "sponsors_delete_public" on public.sponsors
  for delete using (true);

-- =====================================================
-- STORAGE : buckets
-- =====================================================
-- À créer manuellement dans l'UI Supabase OU via SQL :
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sponsors', 'sponsors', true)
on conflict (id) do nothing;

-- Policies storage : upload public
drop policy if exists "posters_insert_public" on storage.objects;
create policy "posters_insert_public" on storage.objects
  for insert with check (bucket_id = 'posters');

drop policy if exists "posters_select_public" on storage.objects;
create policy "posters_select_public" on storage.objects
  for select using (bucket_id = 'posters');

drop policy if exists "sponsors_insert_public" on storage.objects;
create policy "sponsors_insert_public" on storage.objects
  for insert with check (bucket_id = 'sponsors');

drop policy if exists "sponsors_select_public" on storage.objects;
create policy "sponsors_select_public" on storage.objects
  for select using (bucket_id = 'sponsors');

drop policy if exists "sponsors_delete_public" on storage.objects;
create policy "sponsors_delete_public" on storage.objects
  for delete using (bucket_id in ('sponsors', 'posters'));
