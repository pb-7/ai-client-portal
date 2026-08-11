begin;

alter table public.clients
  add column deleted_at timestamptz,
  add column deleted_by uuid
    references public.profiles (id)
    on delete set null;

create index clients_deleted_at_idx
  on public.clients (deleted_at desc)
  where deleted_at is not null;

comment on column public.clients.deleted_at is
  'Soft-deletion timestamp. Records become eligible for permanent deletion after seven days; automated purging is deferred.';

comment on column public.clients.deleted_by is
  'Authenticated profile that soft-deleted the client. The reference is cleared if that profile is removed.';

-- Treat a non-null deleted_at update as the deletion request, but never trust
-- the submitted timestamp or actor. BEFORE triggers run before the RLS
-- WITH CHECK expression evaluates the new row.
create function private.stamp_client_soft_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if old.deleted_at is null and new.deleted_at is not null then
    if actor_id is null then
      raise exception using
        errcode = '42501',
        message = 'Client deletion requires an authenticated actor.';
    end if;

    new.deleted_at := pg_catalog.statement_timestamp();
    new.deleted_by := actor_id;
  end if;

  return new;
end;
$$;

revoke all on function private.stamp_client_soft_deletion() from public;

create trigger clients_stamp_soft_deletion
before update of deleted_at on public.clients
for each row execute function private.stamp_client_soft_deletion();

-- Replace the broad advisor policy so advisors cannot permanently delete
-- clients and cannot read or mutate clients after soft deletion.
drop policy if exists "clients: advisors manage assigned" on public.clients;

create policy "clients: advisors read assigned active records"
on public.clients
for select
to authenticated
using (
  advisor_id = (select auth.uid())
  and deleted_at is null
  and (select private.is_advisor())
);

create policy "clients: advisors create assigned records"
on public.clients
for insert
to authenticated
with check (
  advisor_id = (select auth.uid())
  and deleted_at is null
  and deleted_by is null
  and (select private.is_advisor())
);

create policy "clients: advisors update assigned active records"
on public.clients
for update
to authenticated
using (
  advisor_id = (select auth.uid())
  and deleted_at is null
  and (select private.is_advisor())
)
with check (
  advisor_id = (select auth.uid())
  and (select private.is_advisor())
  and (
    (deleted_at is null and deleted_by is null)
    or (
      deleted_at is not null
      and deleted_by = (select auth.uid())
    )
  )
);

-- Related records remain stored but become inaccessible to advisors while
-- their parent client is soft-deleted. Admin access remains unchanged.
create or replace function private.has_assigned_client(target_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.clients as client
    join public.profiles as profile
      on profile.id = client.advisor_id
    where client.id = target_client_id
      and client.advisor_id = (select auth.uid())
      and client.deleted_at is null
      and profile.role = 'advisor'
      and not profile.disabled
  );
$$;

commit;
