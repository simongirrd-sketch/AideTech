-- ============================================
-- SiteMAINT — Schéma Supabase (profiles + documents + RLS)
-- Exécuter dans Supabase SQL editor
-- ============================================

-- Table profiles : lier auth.users à un profil + is_admin
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null,
  email text,
  full_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy : users peuvent voir leur propre profil
create policy "users_read_own_profile" on public.profiles
  for select using (auth.uid() = id);

-- Table documents : fiches machines / documentation
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text not null,
  category text not null,
  subcategory text,
  marque text,
  modele text,
  description text,
  content jsonb default '{}'::jsonb,
  notes jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  procedures_controle jsonb default '[]'::jsonb,
  causes_possibles jsonb default '[]'::jsonb,
  bonnes_pratiques jsonb default '[]'::jsonb,
  pannes_frequentes jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_slug_per_category unique (slug, category)
);

-- Enable RLS
alter table public.documents enable row level security;

-- Policy : tous les utilisateurs authentifiés peuvent lire
create policy "authenticated_read_documents" on public.documents
  for select using (auth.role() = 'authenticated'::text or true);

-- Policy : seulement les admins peuvent créer/modifier/supprimer
create policy "admins_manage_documents" on public.documents
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Trigger : mettre à jour updated_at automatiquement
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_documents_updated_at before update on public.documents
  for each row execute function public.update_updated_at_column();
