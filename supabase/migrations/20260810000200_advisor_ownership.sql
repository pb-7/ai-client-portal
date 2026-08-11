begin;

-- Remove the applied membership-era policies before changing the role type.
-- The transaction keeps the database default-deny if any later step fails.
drop policy if exists "profiles: admins manage all" on public.profiles;
drop policy if exists "profiles: users read own active profile" on public.profiles;
drop policy if exists "clients: admins manage all" on public.clients;
drop policy if exists "clients: members read authorized household" on public.clients;
drop policy if exists "memberships: admins manage all" on public.memberships;
drop policy if exists "memberships: users read own active memberships" on public.memberships;
drop policy if exists "client inputs: admins manage all" on public.client_inputs;
drop policy if exists "narratives: admins manage all" on public.narratives;
drop policy if exists "narratives: members read published" on public.narratives;
drop policy if exists "narrative versions: admins manage all" on public.narrative_versions;
drop policy if exists "narrative versions: members read published" on public.narrative_versions;

revoke execute on function private.is_active_user() from authenticated;
revoke execute on function private.is_admin() from authenticated;
revoke execute on function private.has_client_access(uuid) from authenticated;

drop function private.is_active_user();
drop function private.is_admin();
drop function private.has_client_access(uuid);

-- PostgreSQL enums cannot remove a value in place. Rebuild the enum and map
-- legacy client profiles to the new internal advisor role. Disable those
-- profiles first so a former client account cannot gain advisor privileges
-- without an administrator explicitly reviewing it.
update public.profiles
set disabled = true
where role = 'client';

alter type public.app_role rename to app_role_legacy;
create type public.app_role as enum ('admin', 'advisor');

alter table public.profiles
  alter column role drop default;

alter table public.profiles
  alter column role type public.app_role
  using (
    case role::text
      when 'client' then 'advisor'
      else role::text
    end
  )::public.app_role;

alter table public.profiles
  alter column role set default 'advisor'::public.app_role;

drop type public.app_role_legacy;

revoke all on type public.app_role from public, anon;
grant usage on type public.app_role to authenticated;

alter table public.clients
  add column advisor_id uuid
  references public.profiles (id)
  on delete restrict;

-- An active legacy client must have exactly one active membership owned by a
-- profile that has just become an advisor. Abort instead of guessing when the
-- remote data is missing or ambiguous.
do $$
begin
  if exists (
    select 1
    from public.clients as client
    where client.status = 'active'
      and (
        select count(*)
        from public.memberships as membership
        join public.profiles as profile
          on profile.id = membership.profile_id
        where membership.client_id = client.id
          and membership.status = 'active'
          and profile.role = 'advisor'
      ) <> 1
  ) then
    raise exception using
      errcode = '23514',
      message = 'Advisor ownership migration requires exactly one active advisor membership for every active client.';
  end if;
end;
$$;

with advisor_assignments as (
  select
    membership.client_id,
    (array_agg(
      membership.profile_id
      order by membership.created_at, membership.id
    ))[1] as profile_id
  from public.memberships as membership
  join public.profiles as profile
    on profile.id = membership.profile_id
  where membership.status = 'active'
    and profile.role = 'advisor'
  group by membership.client_id
  having count(*) = 1
)
update public.clients as client
set advisor_id = assignment.profile_id
from advisor_assignments as assignment
where client.id = assignment.client_id
  and client.advisor_id is null;

alter table public.clients
  add constraint active_clients_require_advisor
  check (status <> 'active' or advisor_id is not null)
  not valid;

alter table public.clients
  validate constraint active_clients_require_advisor;

create index clients_advisor_id_idx
  on public.clients (advisor_id);

comment on column public.clients.advisor_id is
  'The single advisor responsible for this client in the assessment MVP. A future multi-advisor model should use a dedicated assignment table.';

-- Keep the legacy table to avoid destructive loss of remotely applied data,
-- but remove every policy and privilege that could make it an access path.
comment on table public.memberships is
  'Deprecated after the advisor ownership migration. Retained only as legacy migration data; it is not an authorization source.';

revoke all on table public.memberships from anon, authenticated;
revoke all on type public.membership_status from public, anon, authenticated;

create function private.enforce_client_advisor_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.advisor_id is not null
    and not exists (
      select 1
      from public.profiles as profile
      where profile.id = new.advisor_id
        and profile.role = 'advisor'
    )
  then
    raise exception using
      errcode = '23514',
      message = 'clients.advisor_id must reference an advisor profile.';
  end if;

  return new;
end;
$$;

create trigger clients_enforce_advisor_role
before insert or update of advisor_id on public.clients
for each row execute function private.enforce_client_advisor_role();

create function private.prevent_assigned_advisor_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'advisor'
    and new.role <> 'advisor'
    and exists (
      select 1
      from public.clients as client
      where client.advisor_id = old.id
    )
  then
    raise exception using
      errcode = '23514',
      message = 'An assigned advisor profile cannot change roles.';
  end if;

  return new;
end;
$$;

create trigger profiles_preserve_assigned_advisor_role
before update of role on public.profiles
for each row execute function private.prevent_assigned_advisor_role_change();

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

create function private.is_advisor()
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
      and profile.role = 'advisor'
      and not profile.disabled
  );
$$;

create function private.has_assigned_client(target_client_id uuid)
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
      and profile.role = 'advisor'
      and not profile.disabled
  );
$$;

revoke all on function private.enforce_client_advisor_role() from public;
revoke all on function private.prevent_assigned_advisor_role_change() from public;
revoke all on function private.is_active_user() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.is_advisor() from public;
revoke all on function private.has_assigned_client(uuid) from public;

grant execute on function private.is_active_user() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_advisor() to authenticated;
grant execute on function private.has_assigned_client(uuid) to authenticated;

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

create policy "clients: advisors manage assigned"
on public.clients
for all
to authenticated
using (
  advisor_id = (select auth.uid())
  and (select private.is_advisor())
)
with check (
  advisor_id = (select auth.uid())
  and (select private.is_advisor())
);

create policy "client inputs: admins manage all"
on public.client_inputs
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "client inputs: advisors manage assigned"
on public.client_inputs
for all
to authenticated
using ((select private.has_assigned_client(client_id)))
with check ((select private.has_assigned_client(client_id)));

create policy "narratives: admins manage all"
on public.narratives
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "narratives: advisors manage assigned"
on public.narratives
for all
to authenticated
using ((select private.has_assigned_client(client_id)))
with check ((select private.has_assigned_client(client_id)));

create policy "narrative versions: admins manage all"
on public.narrative_versions
for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "narrative versions: advisors manage assigned"
on public.narrative_versions
for all
to authenticated
using ((select private.has_assigned_client(client_id)))
with check ((select private.has_assigned_client(client_id)));

commit;
