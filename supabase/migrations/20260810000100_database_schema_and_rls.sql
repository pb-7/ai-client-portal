begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.app_role as enum ('admin', 'client');
create type public.client_status as enum ('active', 'archived');
create type public.membership_status as enum ('active', 'disabled');
create type public.narrative_status as enum ('draft', 'published', 'archived');
create type public.narrative_version_status as enum (
  'draft',
  'reviewed',
  'published'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'client',
  disabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  status public.client_status not null default 'active',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, client_id)
);

create table public.client_inputs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique references public.clients (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.narratives (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  status public.narrative_status not null default 'draft',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  published_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint narratives_one_per_client unique (client_id),
  unique (id, client_id)
);

comment on constraint narratives_one_per_client on public.narratives is
  'The assessment MVP has one logical narrative per client, with narrative_versions preserving history. Supporting multiple meetings or reviews should introduce a separate meeting or review entity instead of ambiguous parallel narratives.';

create table public.narrative_versions (
  id uuid primary key default gen_random_uuid(),
  narrative_id uuid not null,
  client_id uuid not null,
  version_number integer not null check (version_number > 0),
  status public.narrative_version_status not null default 'draft',
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  model_provider text,
  model_name text,
  prompt_version text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (narrative_id, client_id)
    references public.narratives (id, client_id)
    on delete cascade,
  unique (narrative_id, version_number)
);

create unique index narrative_versions_one_published_per_narrative
  on public.narrative_versions (narrative_id)
  where status = 'published';

create index memberships_profile_status_idx
  on public.memberships (profile_id, status);
create index memberships_client_status_idx
  on public.memberships (client_id, status);
create index narratives_client_status_idx
  on public.narratives (client_id, status);
create index narrative_versions_client_status_idx
  on public.narrative_versions (client_id, status);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function private.set_updated_at();

create trigger client_inputs_set_updated_at
before update on public.client_inputs
for each row execute function private.set_updated_at();

create trigger narratives_set_updated_at
before update on public.narratives
for each row execute function private.set_updated_at();

create function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and not profile.disabled
  );
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'admin'
      and not profile.disabled
  );
$$;

create function private.has_client_access(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as membership
    join public.profiles as profile on profile.id = membership.profile_id
    join public.clients as client on client.id = membership.client_id
    where membership.profile_id = (select auth.uid())
      and membership.client_id = target_client_id
      and membership.status = 'active'
      and client.status = 'active'
      and not profile.disabled
  );
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.is_active_user() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.has_client_access(uuid) from public;

grant execute on function private.set_updated_at() to authenticated;
grant execute on function private.is_active_user() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_client_access(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.memberships enable row level security;
alter table public.client_inputs enable row level security;
alter table public.narratives enable row level security;
alter table public.narrative_versions enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.clients from anon, authenticated;
revoke all on table public.memberships from anon, authenticated;
revoke all on table public.client_inputs from anon, authenticated;
revoke all on table public.narratives from anon, authenticated;
revoke all on table public.narrative_versions from anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.memberships to authenticated;
grant select, insert, update, delete on table public.client_inputs to authenticated;
grant select, insert, update, delete on table public.narratives to authenticated;
grant select, insert, update, delete on table public.narrative_versions to authenticated;

revoke all on type public.app_role from anon;
revoke all on type public.client_status from anon;
revoke all on type public.membership_status from anon;
revoke all on type public.narrative_status from anon;
revoke all on type public.narrative_version_status from anon;

grant usage on type public.app_role to authenticated;
grant usage on type public.client_status to authenticated;
grant usage on type public.membership_status to authenticated;
grant usage on type public.narrative_status to authenticated;
grant usage on type public.narrative_version_status to authenticated;

create policy "profiles: admins manage all"
on public.profiles
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "profiles: users read own active profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  and not disabled
);

create policy "clients: admins manage all"
on public.clients
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "clients: members read authorized household"
on public.clients
for select
to authenticated
using ((select private.has_client_access(id)));

create policy "memberships: admins manage all"
on public.memberships
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "memberships: users read own active memberships"
on public.memberships
for select
to authenticated
using (
  profile_id = (select auth.uid())
  and status = 'active'
  and (select private.is_active_user())
);

create policy "client inputs: admins manage all"
on public.client_inputs
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "narratives: admins manage all"
on public.narratives
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "narratives: members read published"
on public.narratives
for select
to authenticated
using (
  status = 'published'
  and (select private.has_client_access(client_id))
);

create policy "narrative versions: admins manage all"
on public.narrative_versions
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "narrative versions: members read published"
on public.narrative_versions
for select
to authenticated
using (
  status = 'published'
  and (select private.has_client_access(client_id))
  and exists (
    select 1
    from public.narratives as narrative
    where narrative.id = narrative_versions.narrative_id
      and narrative.client_id = narrative_versions.client_id
      and narrative.status = 'published'
  )
);

commit;
