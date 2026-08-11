begin;

create extension if not exists pgcrypto with schema extensions;

alter table public.narrative_versions
  add constraint narrative_versions_id_client_id_key unique (id, client_id);

create table public.client_page_publications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null unique
    references public.clients (id)
    on delete restrict,
  slug text not null unique
    check (
      length(slug) between 3 and 100
      and slug = lower(slug)
      and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    ),
  narrative_version_id uuid not null,
  password_hash text not null
    check (length(password_hash) between 50 and 100),
  data_access_token_hash text not null
    check (data_access_token_hash ~ '^[0-9a-f]{64}$'),
  published boolean not null default true,
  published_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  unpublished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (narrative_version_id, client_id)
    references public.narrative_versions (id, client_id)
    on delete restrict
);

create index client_page_publications_published_slug_idx
  on public.client_page_publications (slug)
  where published;

comment on table public.client_page_publications is
  'One password-protected page per client, pinned to an immutable reviewed narrative version. Password and server-capability hashes are excluded from authenticated SELECT grants.';

comment on column public.client_page_publications.password_hash is
  'A bcrypt password hash. Plaintext client-page passwords are never stored.';

comment on column public.client_page_publications.data_access_token_hash is
  'SHA-256 hash of a server-derived capability required by the narrow anonymous read function.';

create function private.has_publishable_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients as client
    where client.id = target_client_id
      and client.status = 'active'
      and client.deleted_at is null
  );
$$;

create function private.is_reviewed_client_version(
  target_version_id uuid,
  target_client_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.narrative_versions as version
    where version.id = target_version_id
      and version.client_id = target_client_id
      and version.status = 'reviewed'
  );
$$;

create function private.stamp_client_page_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  current_time timestamptz := pg_catalog.statement_timestamp();
begin
  if actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Publishing requires an authenticated actor.';
  end if;

  if tg_op = 'INSERT' then
    if not new.published then
      raise exception using
        errcode = '23514',
        message = 'A new client-page publication must be published.';
    end if;

    new.published_by := actor_id;
    new.updated_by := actor_id;
    new.published_at := current_time;
    new.unpublished_at := null;
    new.created_at := current_time;
    new.updated_at := current_time;
    return new;
  end if;

  if new.client_id is distinct from old.client_id
    or new.slug is distinct from old.slug
  then
    raise exception using
      errcode = '23514',
      message = 'A publication client and slug are immutable.';
  end if;

  new.updated_by := actor_id;
  new.updated_at := current_time;
  new.created_at := old.created_at;
  new.published_by := old.published_by;
  new.published_at := old.published_at;
  new.unpublished_at := old.unpublished_at;

  if new.published and (
    not old.published
    or new.narrative_version_id is distinct from old.narrative_version_id
    or new.password_hash is distinct from old.password_hash
  ) then
    new.published_by := actor_id;
    new.published_at := current_time;
    new.unpublished_at := null;
  elsif old.published and not new.published then
    new.unpublished_at := current_time;
  end if;

  return new;
end;
$$;

revoke all on function private.has_publishable_client(uuid) from public;
revoke all on function private.is_reviewed_client_version(uuid, uuid) from public;
revoke all on function private.stamp_client_page_publication() from public;

grant execute on function private.has_publishable_client(uuid) to authenticated;
grant execute on function private.is_reviewed_client_version(uuid, uuid) to authenticated;

create trigger client_page_publications_stamp_actor
before insert or update on public.client_page_publications
for each row execute function private.stamp_client_page_publication();

alter table public.client_page_publications enable row level security;

revoke all on table public.client_page_publications from anon, authenticated;
grant insert, update on table public.client_page_publications to authenticated;
grant select (
  id,
  client_id,
  slug,
  narrative_version_id,
  published,
  published_by,
  updated_by,
  published_at,
  unpublished_at,
  created_at,
  updated_at
) on public.client_page_publications to authenticated;

create policy "client page publications: admins read active clients"
on public.client_page_publications
for select
to authenticated
using (
  (select private.is_admin())
  and (select private.has_publishable_client(client_id))
);

create policy "client page publications: admins publish active clients"
on public.client_page_publications
for insert
to authenticated
with check (
  (select private.is_admin())
  and (select private.has_publishable_client(client_id))
  and (select private.is_reviewed_client_version(narrative_version_id, client_id))
);

create policy "client page publications: admins update active clients"
on public.client_page_publications
for update
to authenticated
using (
  (select private.is_admin())
  and (select private.has_publishable_client(client_id))
)
with check (
  (select private.is_admin())
  and (select private.has_publishable_client(client_id))
  and (select private.is_reviewed_client_version(narrative_version_id, client_id))
);

create policy "client page publications: advisors read assigned active clients"
on public.client_page_publications
for select
to authenticated
using (
  (select private.has_assigned_client(client_id))
  and (select private.has_publishable_client(client_id))
);

create policy "client page publications: advisors publish assigned active clients"
on public.client_page_publications
for insert
to authenticated
with check (
  (select private.has_assigned_client(client_id))
  and (select private.has_publishable_client(client_id))
  and (select private.is_reviewed_client_version(narrative_version_id, client_id))
);

create policy "client page publications: advisors update assigned active clients"
on public.client_page_publications
for update
to authenticated
using (
  (select private.has_assigned_client(client_id))
  and (select private.has_publishable_client(client_id))
)
with check (
  (select private.has_assigned_client(client_id))
  and (select private.has_publishable_client(client_id))
  and (select private.is_reviewed_client_version(narrative_version_id, client_id))
);

-- This is the only anonymous data path. It returns one active publication and
-- only when the caller proves possession of a 256-bit server-derived
-- capability. Anonymous roles receive no direct table privileges.
create function public.get_published_client_page(
  target_slug text,
  server_access_token text
)
returns table (
  publication_id uuid,
  publication_slug text,
  publication_updated_at timestamptz,
  narrative_version_id uuid,
  password_hash text,
  client_name text,
  client_inputs jsonb,
  narrative_content jsonb,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    publication.id,
    publication.slug,
    publication.updated_at,
    publication.narrative_version_id,
    publication.password_hash,
    client.name,
    inputs.data,
    version.content,
    publication.published_at
  from public.client_page_publications as publication
  join public.clients as client
    on client.id = publication.client_id
  join public.client_inputs as inputs
    on inputs.client_id = client.id
  join public.narrative_versions as version
    on version.id = publication.narrative_version_id
    and version.client_id = client.id
  where publication.slug = pg_catalog.lower(pg_catalog.btrim(target_slug))
    and publication.published
    and client.status = 'active'
    and client.deleted_at is null
    and version.status = 'reviewed'
    and server_access_token is not null
    and publication.data_access_token_hash = pg_catalog.encode(
      extensions.digest(
        pg_catalog.convert_to(server_access_token, 'UTF8'),
        'sha256'
      ),
      'hex'
    )
  limit 1;
$$;

revoke all on function public.get_published_client_page(text, text)
  from public, authenticated;
grant execute on function public.get_published_client_page(text, text) to anon;

comment on function public.get_published_client_page(text, text) is
  'Returns one active published snapshot to server code holding the matching per-slug capability. It is not a general anonymous table read.';

commit;
