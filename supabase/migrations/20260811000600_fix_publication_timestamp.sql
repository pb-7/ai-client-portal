begin;

-- `current_time` is a PostgreSQL special expression that resolves to a
-- time-with-time-zone value. Use an unambiguous variable name so publication
-- audit columns receive the complete statement timestamp.
create or replace function private.stamp_client_page_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  event_timestamp timestamptz := pg_catalog.statement_timestamp();
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
    new.published_at := event_timestamp;
    new.unpublished_at := null;
    new.created_at := event_timestamp;
    new.updated_at := event_timestamp;
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
  new.updated_at := event_timestamp;
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
    new.published_at := event_timestamp;
    new.unpublished_at := null;
  elsif old.published and not new.published then
    new.unpublished_at := event_timestamp;
  end if;

  return new;
end;
$$;

revoke all on function private.stamp_client_page_publication() from public;

commit;
