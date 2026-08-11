begin;

create function private.has_active_client(target_client_id uuid)
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
      and client.deleted_at is null
  );
$$;

revoke all on function private.has_active_client(uuid) from public;
grant execute on function private.has_active_client(uuid) to authenticated;

drop policy if exists "narratives: admins manage all" on public.narratives;
drop policy if exists "narratives: advisors manage assigned" on public.narratives;
drop policy if exists "narrative versions: admins manage all"
  on public.narrative_versions;
drop policy if exists "narrative versions: advisors manage assigned"
  on public.narrative_versions;

-- Narrative records are created once for an active client. Updating lifecycle
-- status will be introduced with the later review/publish workflow.
create policy "narratives: admins read active clients"
on public.narratives
for select
to authenticated
using (
  (select private.is_admin())
  and (select private.has_active_client(client_id))
);

create policy "narratives: admins create active client drafts"
on public.narratives
for insert
to authenticated
with check (
  (select private.is_admin())
  and (select private.has_active_client(client_id))
  and status = 'draft'
  and created_by = (select auth.uid())
  and published_by is null
  and published_at is null
);

create policy "narratives: advisors read assigned active clients"
on public.narratives
for select
to authenticated
using ((select private.has_assigned_client(client_id)));

create policy "narratives: advisors create assigned client drafts"
on public.narratives
for insert
to authenticated
with check (
  (select private.has_assigned_client(client_id))
  and status = 'draft'
  and created_by = (select auth.uid())
  and published_by is null
  and published_at is null
);

-- Versions are append-only for this milestone. Both generated drafts and
-- human-reviewed edits are new rows; authenticated users cannot rewrite or
-- delete prior history through the direct Supabase API.
create policy "narrative versions: admins read active clients"
on public.narrative_versions
for select
to authenticated
using (
  (select private.is_admin())
  and (select private.has_active_client(client_id))
);

create policy "narrative versions: admins append active client drafts"
on public.narrative_versions
for insert
to authenticated
with check (
  (select private.is_admin())
  and (select private.has_active_client(client_id))
  and created_by = (select auth.uid())
  and published_at is null
  and (
    (
      status = 'draft'
      and reviewed_by is null
      and reviewed_at is null
    )
    or (
      status = 'reviewed'
      and reviewed_by = (select auth.uid())
      and reviewed_at is not null
    )
  )
);

create policy "narrative versions: advisors read assigned active clients"
on public.narrative_versions
for select
to authenticated
using ((select private.has_assigned_client(client_id)));

create policy "narrative versions: advisors append assigned client drafts"
on public.narrative_versions
for insert
to authenticated
with check (
  (select private.has_assigned_client(client_id))
  and created_by = (select auth.uid())
  and published_at is null
  and (
    (
      status = 'draft'
      and reviewed_by is null
      and reviewed_at is null
    )
    or (
      status = 'reviewed'
      and reviewed_by = (select auth.uid())
      and reviewed_at is not null
    )
  )
);

comment on function private.has_active_client(uuid) is
  'Returns whether a client exists and is not soft-deleted without exposing the client row.';

commit;
