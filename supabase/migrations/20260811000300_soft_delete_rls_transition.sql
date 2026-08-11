begin;

-- PostgreSQL checks an UPDATE's old and new rows against applicable SELECT
-- policies. Permit only the trigger-stamped deletion row during the statement
-- that performs the soft delete; later statements cannot read the deleted row.
drop policy if exists "clients: advisors read assigned active records"
  on public.clients;

create policy "clients: advisors read assigned active records"
on public.clients
for select
to authenticated
using (
  advisor_id = (select auth.uid())
  and (select private.is_advisor())
  and (
    deleted_at is null
    or (
      deleted_by = (select auth.uid())
      and deleted_at = pg_catalog.statement_timestamp()
    )
  )
);

comment on policy "clients: advisors read assigned active records"
  on public.clients is
  'Advisors can read assigned active clients. A trigger-stamped deletion row remains visible only within its originating UPDATE statement so PostgreSQL RLS can complete the transition.';

commit;
