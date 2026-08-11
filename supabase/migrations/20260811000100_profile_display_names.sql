begin;

alter table public.profiles
  add column display_name text,
  add constraint profiles_display_name_not_blank
    check (display_name is null or length(trim(display_name)) > 0);

comment on column public.profiles.display_name is
  'Optional display name for an administrator or advisor profile.';

commit;
